import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Prisma, OrderStatus, OrderItemStatus, PaymentMethod } from "@prisma/client";
import {
  router,
  publicProcedure,
  protectedProcedure,
  requirePermission,
} from "@/lib/trpc/init";
import { prisma } from "@/lib/db";
import { checkRateLimit, rateLimits } from "@/lib/rate-limit";

/**
 * Orders Router
 *
 * Handles order operations for both customers (public) and staff (protected).
 * Customers can create orders without authentication via QR code scanning.
 *
 * Public endpoints (customer-facing):
 * - validateTable: Verify table exists and is valid for ordering
 * - createOrder: Submit a new order from the customer menu
 * - getOrderStatus: Check order status by order number
 *
 * Protected endpoints (staff):
 * - list: View all orders for the tenant
 * - getById: Get detailed order information
 * - updateStatus: Change order status (confirm, start prep, mark ready, etc.)
 */

// Validation schemas for order items
const orderItemSchema = z.object({
  dishId: z.string().cuid("Invalid dish ID"),
  quantity: z.number().int().positive("Quantity must be positive"),
  notes: z.string().max(500).optional(),
});

// Sanitize notes to prevent XSS in non-React contexts (emails, PDFs)
const sanitizedNotesSchema = z
  .string()
  .max(1000)
  .refine(
    (val) => !/<script\b[^>]*>[\s\S]*?<\/script>/gi.test(val),
    { message: "Invalid characters in notes" }
  )
  .refine(
    (val) => !/on\w+\s*=/gi.test(val),
    { message: "Invalid characters in notes" }
  )
  .optional();

const createOrderSchema = z.object({
  tenantSlug: z.string().min(1, "Tenant slug is required"),
  tableCode: z.string().length(6, "Table code must be 6 characters"),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
  customerNotes: sanitizedNotesSchema,
  tipPercentage: z.number().min(0).max(100).optional(),
});

const getOrderStatusSchema = z.object({
  tenantSlug: z.string(),
  tableCode: z.string().length(6),
  orderNumber: z.number().int().positive(),
});

export const ordersRouter = router({
  /**
   * Validate that a table exists and can accept orders.
   * Used when customer scans QR code to verify table validity.
   */
  validateTable: publicProcedure
    .input(
      z.object({
        tenantSlug: z.string(),
        qrCode: z.string().length(6),
      })
    )
    .query(async ({ input }) => {
      // Find the tenant
      const tenant = await prisma.tenant.findUnique({
        where: { slug: input.tenantSlug, isActive: true },
        include: {
          settings: true,
        },
      });

      if (!tenant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Restaurant not found",
        });
      }

      // Find the table by QR code
      const table = await prisma.table.findFirst({
        where: {
          tenantId: tenant.id,
          qrCode: input.qrCode,
          isActive: true,
        },
      });

      if (!table) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Table not found",
        });
      }

      return {
        valid: true,
        table: {
          id: table.id,
          number: table.number,
          name: table.name,
          status: table.status,
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          logoUrl: tenant.logoUrl,
        },
        settings: tenant.settings
          ? {
              vatRate: tenant.settings.vatRate.toNumber(),
              tipEnabled: tenant.settings.tipEnabled,
              tipPercentages: tenant.settings.tipPercentages,
              currency: tenant.settings.currency,
            }
          : {
              vatRate: 10,
              tipEnabled: true,
              tipPercentages: [5, 10, 15],
              currency: "EUR",
            },
      };
    }),

  /**
   * Create a new order from customer menu.
   * This is a public endpoint - no authentication required.
   * Orders are linked to the tenant and table via QR code.
   */
  createOrder: publicProcedure
    .input(createOrderSchema)
    .mutation(async ({ input }) => {
      // Rate limit by table code to prevent order spam
      const rateKey = `order:${input.tenantSlug}:${input.tableCode}`;
      const rateResult = checkRateLimit(rateKey, rateLimits.createOrder);
      if (!rateResult.success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many orders. Please wait a moment before ordering again.",
        });
      }

      // Find the tenant
      const tenant = await prisma.tenant.findUnique({
        where: { slug: input.tenantSlug, isActive: true },
        include: { settings: true },
      });

      if (!tenant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Restaurant not found",
        });
      }

      // Find the table
      const table = await prisma.table.findFirst({
        where: {
          tenantId: tenant.id,
          qrCode: input.tableCode,
          isActive: true,
        },
      });

      if (!table) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Table not found",
        });
      }

      // Get all requested dishes with their categories (for prep sector)
      const dishIds = input.items.map((item) => item.dishId);
      const dishes = await prisma.dish.findMany({
        where: {
          id: { in: dishIds },
          tenantId: tenant.id,
          isAvailable: true,
          isInStock: true,
        },
        include: {
          category: {
            select: {
              prepSectorId: true,
            },
          },
        },
      });

      // Verify all dishes exist and are available
      if (dishes.length !== dishIds.length) {
        const foundIds = new Set(dishes.map((d) => d.id));
        const missingIds = dishIds.filter((id) => !foundIds.has(id));
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Some dishes are no longer available: ${missingIds.join(", ")}`,
        });
      }

      // Create a map for quick dish lookup
      const dishMap = new Map(dishes.map((d) => [d.id, d]));

      // Calculate subtotal
      let subtotal = 0;
      for (const item of input.items) {
        const dish = dishMap.get(item.dishId)!;
        subtotal += dish.price.toNumber() * item.quantity;
      }

      // Get VAT rate from settings or default to 10%
      const vatRate = tenant.settings?.vatRate.toNumber() ?? 10;
      const vatAmount = subtotal * (vatRate / 100);

      // Calculate tip if provided
      const tipAmount = input.tipPercentage
        ? subtotal * (input.tipPercentage / 100)
        : 0;

      // Calculate total
      const total = subtotal + vatAmount + tipAmount;

      // Create order with items in a transaction (Serializable to prevent race condition on order number)
      const order = await prisma.$transaction(async (tx) => {
        // Generate order number inside transaction to prevent race condition
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lastOrder = await tx.order.findFirst({
          where: {
            tenantId: tenant.id,
            createdAt: { gte: today },
          },
          orderBy: { orderNumber: "desc" },
          select: { orderNumber: true },
        });

        const orderNumber = (lastOrder?.orderNumber ?? 0) + 1;

        // Create the order
        const newOrder = await tx.order.create({
          data: {
            tenantId: tenant.id,
            tableId: table.id,
            orderNumber,
            status: "PENDING",
            customerNotes: input.customerNotes,
            subtotal: new Prisma.Decimal(subtotal),
            vatAmount: new Prisma.Decimal(vatAmount),
            tipAmount: new Prisma.Decimal(tipAmount),
            total: new Prisma.Decimal(total),
          },
        });

        // Create order items
        const orderItems = input.items.map((item) => {
          const dish = dishMap.get(item.dishId)!;
          return {
            orderId: newOrder.id,
            dishId: item.dishId,
            prepSectorId: dish.category.prepSectorId,
            quantity: item.quantity,
            unitPrice: dish.price,
            notes: item.notes,
            status: "PENDING" as const,
          };
        });

        await tx.orderItem.createMany({
          data: orderItems,
        });

        // Create initial status history entry
        await tx.orderStatusHistory.create({
          data: {
            orderId: newOrder.id,
            fromStatus: null,
            toStatus: "PENDING",
            notes: "Order placed by customer",
          },
        });

        // Update table status to OCCUPIED if it was AVAILABLE
        if (table.status === "AVAILABLE") {
          await tx.table.update({
            where: { id: table.id },
            data: { status: "OCCUPIED" },
          });
        }

        return newOrder;
      });

      return {
        success: true,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          total: order.total.toNumber(),
          createdAt: order.createdAt,
        },
      };
    }),

  /**
   * Get order status for a customer.
   * Customers can check their order status using order number and table code.
   */
  getOrderStatus: publicProcedure
    .input(getOrderStatusSchema)
    .query(async ({ input }) => {
      // Find the tenant
      const tenant = await prisma.tenant.findUnique({
        where: { slug: input.tenantSlug, isActive: true },
      });

      if (!tenant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Restaurant not found",
        });
      }

      // Find the table
      const table = await prisma.table.findFirst({
        where: {
          tenantId: tenant.id,
          qrCode: input.tableCode,
          isActive: true,
        },
      });

      if (!table) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Table not found",
        });
      }

      // Find the order
      const order = await prisma.order.findFirst({
        where: {
          tenantId: tenant.id,
          tableId: table.id,
          orderNumber: input.orderNumber,
        },
        include: {
          items: {
            include: {
              dish: {
                select: {
                  id: true,
                  name: true,
                  nameEn: true,
                  imageUrl: true,
                },
              },
            },
          },
          statusHistory: {
            orderBy: { changedAt: "desc" },
            take: 10,
          },
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        customerNotes: order.customerNotes,
        subtotal: order.subtotal.toNumber(),
        vatAmount: order.vatAmount.toNumber(),
        tipAmount: order.tipAmount.toNumber(),
        total: order.total.toNumber(),
        createdAt: order.createdAt,
        items: order.items.map((item) => ({
          id: item.id,
          dishId: item.dishId,
          dishName: item.dish.name,
          dishNameEn: item.dish.nameEn,
          dishImageUrl: item.dish.imageUrl,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toNumber(),
          notes: item.notes,
          status: item.status,
        })),
        statusHistory: order.statusHistory.map((h) => ({
          fromStatus: h.fromStatus,
          toStatus: h.toStatus,
          changedAt: h.changedAt,
          notes: h.notes,
        })),
      };
    }),

  /**
   * List all orders for the tenant (protected - staff only).
   */
  list: protectedProcedure
    .use(requirePermission("orders", "view"))
    .input(
      z.object({
        status: z.nativeEnum(OrderStatus).optional(),
        tableId: z.string().cuid().optional(),
        limit: z.number().int().positive().max(100).default(50),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;

      const orders = await prisma.order.findMany({
        where: {
          tenantId,
          ...(input.status && { status: input.status }),
          ...(input.tableId && { tableId: input.tableId }),
        },
        include: {
          table: {
            select: {
              id: true,
              number: true,
              name: true,
            },
          },
          items: {
            include: {
              dish: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: { items: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        skip: input.offset,
      });

      return orders.map((order) => ({
        ...order,
        subtotal: order.subtotal.toNumber(),
        vatAmount: order.vatAmount.toNumber(),
        tipAmount: order.tipAmount.toNumber(),
        total: order.total.toNumber(),
        itemCount: order._count.items,
        items: order.items.map((item) => ({
          ...item,
          unitPrice: item.unitPrice.toNumber(),
        })),
      }));
    }),

  /**
   * Get a single order by ID (protected - staff only).
   */
  getById: protectedProcedure
    .use(requirePermission("orders", "view"))
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;

      const order = await prisma.order.findFirst({
        where: { id: input.id, tenantId },
        include: {
          table: true,
          items: {
            include: {
              dish: true,
              prepSector: true,
            },
          },
          statusHistory: {
            orderBy: { changedAt: "desc" },
          },
          payment: true,
          createdBy: {
            select: { id: true, name: true },
          },
          closedBy: {
            select: { id: true, name: true },
          },
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      return {
        ...order,
        subtotal: order.subtotal.toNumber(),
        vatAmount: order.vatAmount.toNumber(),
        tipAmount: order.tipAmount.toNumber(),
        total: order.total.toNumber(),
        items: order.items.map((item) => ({
          ...item,
          unitPrice: item.unitPrice.toNumber(),
          dish: {
            ...item.dish,
            price: item.dish.price.toNumber(),
          },
        })),
        payment: order.payment
          ? {
              ...order.payment,
              amount: order.payment.amount.toNumber(),
            }
          : null,
      };
    }),

  /**
   * Update order status (protected - staff only).
   */
  updateStatus: protectedProcedure
    .use(requirePermission("orders", "update"))
    .input(
      z.object({
        id: z.string().cuid(),
        status: z.nativeEnum(OrderStatus),
        notes: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;
      const userId = ctx.session.user.id;

      const order = await prisma.order.findFirst({
        where: { id: input.id, tenantId },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      // Update order and create status history in transaction
      const updatedOrder = await prisma.$transaction(async (tx) => {
        const updated = await tx.order.update({
          where: { id: input.id },
          data: {
            status: input.status,
            ...(input.status === "PAID" && {
              closedById: userId,
              closedAt: new Date(),
            }),
          },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: input.id,
            fromStatus: order.status,
            toStatus: input.status,
            changedBy: userId,
            notes: input.notes,
          },
        });

        return updated;
      });

      return {
        ...updatedOrder,
        subtotal: updatedOrder.subtotal.toNumber(),
        vatAmount: updatedOrder.vatAmount.toNumber(),
        tipAmount: updatedOrder.tipAmount.toNumber(),
        total: updatedOrder.total.toNumber(),
      };
    }),

  // ============================================
  // PREP CONSOLE ENDPOINTS
  // ============================================

  /**
   * Get order items for a preparation sector (kitchen or bar).
   * Used by prep console to display items grouped by status.
   */
  getItemsBySector: protectedProcedure
    .use(requirePermission("prep", "view"))
    .input(
      z.object({
        sectorCode: z.enum(["KITCHEN", "BAR"]),
        statuses: z
          .array(z.nativeEnum(OrderItemStatus))
          .optional()
          .default(["PENDING", "IN_PROGRESS", "READY"]),
      })
    )
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;
      const userRole = ctx.session.user.role;

      // Validate role has access to the requested sector
      // COOK can only access KITCHEN, BARTENDER can only access BAR
      // ADMIN and SUPER_ADMIN can access both
      if (userRole === "COOK" && input.sectorCode !== "KITCHEN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cooks can only access the kitchen console",
        });
      }
      if (userRole === "BARTENDER" && input.sectorCode !== "BAR") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Bartenders can only access the bar console",
        });
      }

      // Find the prep sector for this tenant
      const prepSector = await prisma.prepSector.findFirst({
        where: {
          tenantId,
          code: input.sectorCode,
        },
      });

      if (!prepSector) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Prep sector ${input.sectorCode} not found for this tenant`,
        });
      }

      // Fetch order items for this sector with their orders
      const orderItems = await prisma.orderItem.findMany({
        where: {
          prepSectorId: prepSector.id,
          status: { in: input.statuses },
          order: {
            tenantId,
            // Only show items from active orders (not cancelled or paid)
            status: {
              notIn: ["CANCELLED", "PAID"],
            },
          },
        },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              customerNotes: true,
              createdAt: true,
              table: {
                select: {
                  id: true,
                  number: true,
                  name: true,
                },
              },
            },
          },
          dish: {
            select: {
              id: true,
              name: true,
              nameEn: true,
              allergens: true,
            },
          },
        },
        orderBy: [
          { order: { createdAt: "asc" } },
          { createdAt: "asc" },
        ],
      });

      // Group items by order and status for the Kanban view
      // Each "card" represents all items from a single order at a specific status
      type OrderGroup = {
        orderId: string;
        orderNumber: number;
        tableNumber: number;
        tableName: string | null;
        createdAt: Date;
        customerNotes: string | null;
        status: OrderItemStatus;
        items: {
          id: string;
          dishId: string;
          dishName: string;
          dishNameEn: string | null;
          quantity: number;
          notes: string | null;
          status: OrderItemStatus;
          allergens: string[];
        }[];
      };

      const orderGroups = new Map<string, OrderGroup>();

      for (const item of orderItems) {
        // Group by order + status (so same order can appear in multiple columns)
        const key = `${item.order.id}-${item.status}`;

        if (!orderGroups.has(key)) {
          orderGroups.set(key, {
            orderId: item.order.id,
            orderNumber: item.order.orderNumber,
            tableNumber: item.order.table.number,
            tableName: item.order.table.name,
            createdAt: item.order.createdAt,
            customerNotes: item.order.customerNotes,
            status: item.status,
            items: [],
          });
        }

        orderGroups.get(key)!.items.push({
          id: item.id,
          dishId: item.dish.id,
          dishName: item.dish.name,
          dishNameEn: item.dish.nameEn,
          quantity: item.quantity,
          notes: item.notes,
          status: item.status,
          allergens: item.dish.allergens,
        });
      }

      // Convert to array and group by status
      const groups = Array.from(orderGroups.values());

      return {
        pending: groups
          .filter((g) => g.status === "PENDING")
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
        inProgress: groups
          .filter((g) => g.status === "IN_PROGRESS")
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
        ready: groups
          .filter((g) => g.status === "READY")
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
      };
    }),

  /**
   * Update a single order item status.
   * Used when individually managing item preparation.
   */
  updateItemStatus: protectedProcedure
    .use(requirePermission("prep", "update"))
    .input(
      z.object({
        itemId: z.string().cuid(),
        status: z.nativeEnum(OrderItemStatus),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;

      // Find the item and verify it belongs to this tenant
      const item = await prisma.orderItem.findFirst({
        where: {
          id: input.itemId,
          order: { tenantId },
        },
        include: {
          prepSector: true,
        },
      });

      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order item not found",
        });
      }

      // Validate state transition
      const validTransitions: Record<OrderItemStatus, OrderItemStatus[]> = {
        PENDING: ["IN_PROGRESS", "CANCELLED"],
        IN_PROGRESS: ["READY", "CANCELLED"],
        READY: ["SERVED", "IN_PROGRESS", "CANCELLED"], // Allow back to IN_PROGRESS in case of mistakes
        SERVED: ["CANCELLED"], // Can only cancel after served
        CANCELLED: [], // Terminal state
      };

      if (!validTransitions[item.status].includes(input.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot transition from ${item.status} to ${input.status}`,
        });
      }

      // CANCELLED status requires admin
      if (
        input.status === "CANCELLED" &&
        !["ADMIN", "SUPER_ADMIN"].includes(ctx.session.user.role)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only administrators can cancel order items",
        });
      }

      // Update the item status with tenant scope to prevent TOCTOU
      const result = await prisma.orderItem.updateMany({
        where: {
          id: input.itemId,
          order: { tenantId },
        },
        data: { status: input.status },
      });

      if (result.count === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order item not found or access denied",
        });
      }

      // Fetch the updated item
      const updated = await prisma.orderItem.findUnique({
        where: { id: input.itemId },
      });

      return {
        ...updated!,
        unitPrice: updated!.unitPrice.toNumber(),
      };
    }),

  /**
   * Bulk update order items to the next status.
   * Used for moving all items of an order at once.
   */
  bulkUpdateItemStatus: protectedProcedure
    .use(requirePermission("prep", "update"))
    .input(
      z.object({
        itemIds: z.array(z.string().cuid()).min(1),
        status: z.enum(["IN_PROGRESS", "READY", "SERVED"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;

      // Find all items and verify they belong to this tenant
      const items = await prisma.orderItem.findMany({
        where: {
          id: { in: input.itemIds },
          order: { tenantId },
        },
      });

      if (items.length !== input.itemIds.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Some order items were not found",
        });
      }

      // Validate all transitions
      const validPreviousStatuses: Record<string, OrderItemStatus[]> = {
        IN_PROGRESS: ["PENDING"],
        READY: ["IN_PROGRESS"],
        SERVED: ["READY"],
      };

      const validPrevious = validPreviousStatuses[input.status];
      const invalidItems = items.filter(
        (item) => !validPrevious.includes(item.status)
      );

      if (invalidItems.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Some items cannot be moved to ${input.status}. Items must be in ${validPrevious.join(" or ")} status.`,
        });
      }

      // Update all items in a transaction with tenant scope
      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.orderItem.updateMany({
          where: {
            id: { in: input.itemIds },
            order: { tenantId },
          },
          data: { status: input.status },
        });

        // Check if we need to update the order status
        // Get the orders affected
        const orderIds = [...new Set(items.map((item) => item.orderId))];

        for (const orderId of orderIds) {
          // Get all items for this order
          const orderItems = await tx.orderItem.findMany({
            where: { orderId },
          });

          // Determine overall order status based on items
          const itemStatuses = orderItems.map((i) => i.status);
          let newOrderStatus: OrderStatus | null = null;

          if (itemStatuses.every((s) => s === "SERVED")) {
            // All items served -> order is DELIVERED
            newOrderStatus = "DELIVERED";
          } else if (itemStatuses.every((s) => s === "READY" || s === "SERVED")) {
            // All items ready or served -> order is READY
            newOrderStatus = "READY";
          } else if (itemStatuses.some((s) => s === "IN_PROGRESS")) {
            // Any item in progress -> order is IN_PROGRESS
            newOrderStatus = "IN_PROGRESS";
          } else if (itemStatuses.every((s) => s === "PENDING")) {
            // All items pending -> order is CONFIRMED (or PENDING)
            newOrderStatus = "CONFIRMED";
          }

          if (newOrderStatus) {
            await tx.order.update({
              where: { id: orderId },
              data: { status: newOrderStatus },
            });
          }
        }

        return updated;
      });

      return {
        success: true,
        updatedCount: result.count,
      };
    }),

  // ============================================
  // TABLE CLOSURE ENDPOINTS
  // ============================================

  /**
   * Close a table by marking its active order as PAID.
   * Creates a payment record and sets table to CLEANING status.
   * This is the primary flow for waiters to finalize a customer's visit.
   */
  closeTable: protectedProcedure
    .use(requirePermission("payments", "process"))
    .input(
      z.object({
        tableId: z.string().cuid("Invalid table ID"),
        paymentMethod: z.nativeEnum(PaymentMethod),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;
      const userId = ctx.session.user.id;

      // Find the table
      const table = await prisma.table.findFirst({
        where: {
          id: input.tableId,
          tenantId,
        },
      });

      if (!table) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Table not found",
        });
      }

      // Only allow closing occupied tables
      if (table.status !== "OCCUPIED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Table is not occupied",
        });
      }

      // Find active orders for this table (not PAID or CANCELLED)
      const activeOrders = await prisma.order.findMany({
        where: {
          tableId: input.tableId,
          tenantId,
          status: {
            notIn: ["PAID", "CANCELLED"],
          },
        },
        include: {
          payment: true,
        },
        orderBy: { createdAt: "desc" },
      });

      if (activeOrders.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No active orders found for this table",
        });
      }

      // Close all active orders in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const closedOrders = [];

        for (const order of activeOrders) {
          // Skip if already has a completed payment
          if (order.payment?.status === "COMPLETED") {
            continue;
          }

          // Create payment if not exists
          if (!order.payment) {
            await tx.payment.create({
              data: {
                tenantId,
                orderId: order.id,
                method: input.paymentMethod,
                status: "COMPLETED",
                amount: order.total,
                paidAt: new Date(),
                metadata: {
                  closedBy: userId,
                  closedVia: "closeTable",
                },
              },
            });
          } else {
            // Update existing pending payment
            await tx.payment.update({
              where: { id: order.payment.id },
              data: {
                method: input.paymentMethod,
                status: "COMPLETED",
                paidAt: new Date(),
              },
            });
          }

          // Update order status
          const updatedOrder = await tx.order.update({
            where: { id: order.id },
            data: {
              status: "PAID",
              closedById: userId,
              closedAt: new Date(),
            },
          });

          // Create status history entry
          await tx.orderStatusHistory.create({
            data: {
              orderId: order.id,
              fromStatus: order.status,
              toStatus: "PAID",
              changedBy: userId,
              notes: `Table closed - Payment via ${input.paymentMethod}`,
            },
          });

          closedOrders.push(updatedOrder);
        }

        // Set table status to CLEANING
        const updatedTable = await tx.table.update({
          where: { id: input.tableId },
          data: { status: "CLEANING" },
        });

        return {
          table: updatedTable,
          closedOrders,
        };
      });

      return {
        success: true,
        table: result.table,
        closedOrderCount: result.closedOrders.length,
        closedOrders: result.closedOrders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          total: order.total.toNumber(),
        })),
      };
    }),

  /**
   * Get active orders for a table.
   * Used to show order summary before closing a table.
   */
  getActiveOrdersForTable: protectedProcedure
    .use(requirePermission("orders", "view"))
    .input(z.object({ tableId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;

      const orders = await prisma.order.findMany({
        where: {
          tableId: input.tableId,
          tenantId,
          status: {
            notIn: ["PAID", "CANCELLED"],
          },
        },
        include: {
          items: {
            include: {
              dish: {
                select: {
                  id: true,
                  name: true,
                  nameEn: true,
                },
              },
            },
          },
          payment: true,
        },
        orderBy: { createdAt: "desc" },
      });

      // Calculate combined total
      const combinedTotal = orders.reduce(
        (sum, order) => sum + order.total.toNumber(),
        0
      );

      return {
        orders: orders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          subtotal: order.subtotal.toNumber(),
          vatAmount: order.vatAmount.toNumber(),
          tipAmount: order.tipAmount.toNumber(),
          total: order.total.toNumber(),
          createdAt: order.createdAt,
          hasPayment: !!order.payment,
          items: order.items.map((item) => ({
            id: item.id,
            dishName: item.dish.name,
            dishNameEn: item.dish.nameEn,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toNumber(),
            status: item.status,
          })),
        })),
        combinedTotal,
        orderCount: orders.length,
      };
    }),
});

export type OrdersRouter = typeof ordersRouter;
