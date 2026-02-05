import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { OrderItemStatus } from "@prisma/client";
import {
  router,
  protectedProcedure,
  requirePermission,
} from "@/lib/trpc/init";
import { prisma } from "@/lib/db";

/**
 * Prep Station Router
 *
 * Dedicated router for the kitchen/bar prep station console.
 * Provides real-time order item management for preparation staff.
 *
 * The console displays orders as "tickets" grouped by their preparation status:
 * - PENDING: Orders waiting to be started
 * - IN_PROGRESS: Orders currently being prepared
 * - READY: Orders ready for pickup by waitstaff
 *
 * Permissions:
 * - ADMIN, SUPER_ADMIN: Full access to all sectors
 * - COOK: Access to KITCHEN sector only
 * - BARTENDER: Access to BAR sector only
 */

// Valid forward state transitions for order items
// Items can only progress forward through the workflow
const VALID_TRANSITIONS: Record<OrderItemStatus, OrderItemStatus[]> = {
  PENDING: ["IN_PROGRESS"],
  IN_PROGRESS: ["READY"],
  READY: ["SERVED"],
  SERVED: [],
  CANCELLED: [],
};

/**
 * Validates that the user has access to the specified prep sector.
 * COOK can only access KITCHEN, BARTENDER can only access BAR.
 * ADMIN and SUPER_ADMIN can access all sectors.
 */
function validateSectorAccess(
  userRole: string,
  sectorCode: string
): void {
  if (userRole === "COOK" && sectorCode !== "KITCHEN") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Cooks can only access the kitchen console",
    });
  }
  if (userRole === "BARTENDER" && sectorCode !== "BAR") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Bartenders can only access the bar console",
    });
  }
}

/**
 * Calculates elapsed time in seconds since the given date.
 */
function calculateElapsedSeconds(since: Date): number {
  return Math.floor((Date.now() - since.getTime()) / 1000);
}

export const prepStationRouter = router({
  /**
   * Get orders for a specific prep sector grouped by item status.
   *
   * Returns order items grouped into PENDING, IN_PROGRESS, and READY buckets.
   * Each group contains tickets with elapsed time calculation for urgency display.
   */
  getOrdersBySector: protectedProcedure
    .use(requirePermission("prep", "view"))
    .input(
      z.object({
        sectorCode: z.string().min(1, "Sector code is required"),
      })
    )
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;
      const userRole = ctx.session.user.role;

      // Validate sector access based on user role
      validateSectorAccess(userRole, input.sectorCode.toUpperCase());

      // Find the prep sector for this tenant
      const prepSector = await prisma.prepSector.findFirst({
        where: {
          tenantId,
          code: input.sectorCode.toUpperCase(),
        },
      });

      if (!prepSector) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Prep sector "${input.sectorCode}" not found`,
        });
      }

      // Fetch active order items for this sector (exclude SERVED and CANCELLED)
      const orderItems = await prisma.orderItem.findMany({
        where: {
          prepSectorId: prepSector.id,
          status: {
            in: ["PENDING", "IN_PROGRESS", "READY"],
          },
          order: {
            tenantId,
            // Only show items from active orders
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

      // Group items by order and status to create "tickets"
      // A ticket represents all items from a single order at a specific status
      type TicketItem = {
        id: string;
        dishId: string;
        dishName: string;
        dishNameEn: string | null;
        quantity: number;
        notes: string | null;
        allergens: string[];
      };

      type Ticket = {
        orderId: string;
        orderNumber: number;
        tableNumber: number;
        tableName: string | null;
        customerNotes: string | null;
        createdAt: Date;
        elapsedSeconds: number;
        items: TicketItem[];
      };

      const ticketMap = new Map<string, Ticket>();

      for (const item of orderItems) {
        // Group by order + status
        const key = `${item.orderId}-${item.status}`;

        if (!ticketMap.has(key)) {
          ticketMap.set(key, {
            orderId: item.order.id,
            orderNumber: item.order.orderNumber,
            tableNumber: item.order.table.number,
            tableName: item.order.table.name,
            customerNotes: item.order.customerNotes,
            createdAt: item.order.createdAt,
            elapsedSeconds: calculateElapsedSeconds(item.order.createdAt),
            items: [],
          });
        }

        ticketMap.get(key)!.items.push({
          id: item.id,
          dishId: item.dish.id,
          dishName: item.dish.name,
          dishNameEn: item.dish.nameEn,
          quantity: item.quantity,
          notes: item.notes,
          allergens: item.dish.allergens,
        });
      }

      // Convert map to array and sort by creation time (oldest first)
      const tickets = Array.from(ticketMap.entries());
      const sortByCreatedAt = (a: Ticket, b: Ticket) =>
        a.createdAt.getTime() - b.createdAt.getTime();

      // Group tickets by status
      const pending: Ticket[] = [];
      const inProgress: Ticket[] = [];
      const ready: Ticket[] = [];

      for (const [key, ticket] of tickets) {
        const status = key.split("-").pop() as OrderItemStatus;
        switch (status) {
          case "PENDING":
            pending.push(ticket);
            break;
          case "IN_PROGRESS":
            inProgress.push(ticket);
            break;
          case "READY":
            ready.push(ticket);
            break;
        }
      }

      return {
        sectorId: prepSector.id,
        sectorCode: prepSector.code,
        sectorName: prepSector.name,
        pending: pending.sort(sortByCreatedAt),
        inProgress: inProgress.sort(sortByCreatedAt),
        ready: ready.sort(sortByCreatedAt),
      };
    }),

  /**
   * Update an order item's status.
   *
   * Validates that state transitions only go forward in the workflow:
   * PENDING -> IN_PROGRESS -> READY -> SERVED
   *
   * Creates an OrderStatusHistory entry for audit trail.
   */
  updateItemStatus: protectedProcedure
    .use(requirePermission("prep", "update"))
    .input(
      z.object({
        itemId: z.string().cuid("Invalid item ID"),
        status: z.nativeEnum(OrderItemStatus),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;
      const userId = ctx.session.user.id;
      const userRole = ctx.session.user.role;

      // Find the item and verify it belongs to this tenant
      const item = await prisma.orderItem.findFirst({
        where: {
          id: input.itemId,
          order: { tenantId },
        },
        include: {
          prepSector: true,
          order: true,
        },
      });

      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order item not found",
        });
      }

      // Validate sector access
      validateSectorAccess(userRole, item.prepSector.code);

      // Validate state transition (can only go forward)
      const validNextStates = VALID_TRANSITIONS[item.status];
      if (!validNextStates.includes(input.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot transition from ${item.status} to ${input.status}. Valid transitions: ${validNextStates.join(", ") || "none"}`,
        });
      }

      // Update item status and create history entry in a transaction
      const updatedItem = await prisma.$transaction(async (tx) => {
        // Update the order item status
        const updated = await tx.orderItem.update({
          where: { id: input.itemId },
          data: { status: input.status },
          include: {
            dish: {
              select: {
                id: true,
                name: true,
                nameEn: true,
              },
            },
          },
        });

        // Create status history entry for audit trail
        await tx.orderStatusHistory.create({
          data: {
            orderId: item.orderId,
            fromStatus: item.order.status,
            toStatus: item.order.status, // Order status unchanged, item status changed
            changedBy: userId,
            notes: `Item "${updated.dish.name}" status changed from ${item.status} to ${input.status}`,
          },
        });

        return updated;
      });

      return {
        id: updatedItem.id,
        orderId: updatedItem.orderId,
        dishId: updatedItem.dishId,
        dishName: updatedItem.dish.name,
        dishNameEn: updatedItem.dish.nameEn,
        quantity: updatedItem.quantity,
        notes: updatedItem.notes,
        status: updatedItem.status,
        unitPrice: updatedItem.unitPrice.toNumber(),
      };
    }),

  /**
   * Mark all IN_PROGRESS items for an order in a sector as READY.
   *
   * Used when all items for a ticket have finished preparation.
   * Only transitions items that are currently IN_PROGRESS.
   */
  markAllReady: protectedProcedure
    .use(requirePermission("prep", "update"))
    .input(
      z.object({
        orderId: z.string().cuid("Invalid order ID"),
        sectorCode: z.string().min(1, "Sector code is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;
      const userId = ctx.session.user.id;
      const userRole = ctx.session.user.role;
      const sectorCode = input.sectorCode.toUpperCase();

      // Validate sector access
      validateSectorAccess(userRole, sectorCode);

      // Find the prep sector
      const prepSector = await prisma.prepSector.findFirst({
        where: {
          tenantId,
          code: sectorCode,
        },
      });

      if (!prepSector) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Prep sector "${input.sectorCode}" not found`,
        });
      }

      // Verify order exists and belongs to tenant
      const order = await prisma.order.findFirst({
        where: {
          id: input.orderId,
          tenantId,
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      // Find all IN_PROGRESS items for this order in this sector
      const itemsToUpdate = await prisma.orderItem.findMany({
        where: {
          orderId: input.orderId,
          prepSectorId: prepSector.id,
          status: "IN_PROGRESS",
        },
      });

      if (itemsToUpdate.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No items in IN_PROGRESS status to mark as READY",
        });
      }

      // Bulk update in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const updateResult = await tx.orderItem.updateMany({
          where: {
            orderId: input.orderId,
            prepSectorId: prepSector.id,
            status: "IN_PROGRESS",
          },
          data: { status: "READY" },
        });

        // Create history entry for the bulk update
        await tx.orderStatusHistory.create({
          data: {
            orderId: input.orderId,
            fromStatus: order.status,
            toStatus: order.status,
            changedBy: userId,
            notes: `${updateResult.count} items marked as READY in ${prepSector.name}`,
          },
        });

        return updateResult;
      });

      return {
        success: true,
        updatedCount: result.count,
        orderId: input.orderId,
        sectorCode: sectorCode,
      };
    }),

  /**
   * Mark items as SERVED (remove from console).
   *
   * Updates READY items to SERVED status, effectively removing them
   * from the prep console display.
   */
  clearTicket: protectedProcedure
    .use(requirePermission("prep", "update"))
    .input(
      z.object({
        orderId: z.string().cuid("Invalid order ID"),
        sectorCode: z.string().min(1, "Sector code is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;
      const userId = ctx.session.user.id;
      const userRole = ctx.session.user.role;
      const sectorCode = input.sectorCode.toUpperCase();

      // Validate sector access
      validateSectorAccess(userRole, sectorCode);

      // Find the prep sector
      const prepSector = await prisma.prepSector.findFirst({
        where: {
          tenantId,
          code: sectorCode,
        },
      });

      if (!prepSector) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Prep sector "${input.sectorCode}" not found`,
        });
      }

      // Verify order exists and belongs to tenant
      const order = await prisma.order.findFirst({
        where: {
          id: input.orderId,
          tenantId,
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      // Find all READY items for this order in this sector
      const itemsToUpdate = await prisma.orderItem.findMany({
        where: {
          orderId: input.orderId,
          prepSectorId: prepSector.id,
          status: "READY",
        },
      });

      if (itemsToUpdate.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No items in READY status to clear",
        });
      }

      // Bulk update in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const updateResult = await tx.orderItem.updateMany({
          where: {
            orderId: input.orderId,
            prepSectorId: prepSector.id,
            status: "READY",
          },
          data: { status: "SERVED" },
        });

        // Create history entry
        await tx.orderStatusHistory.create({
          data: {
            orderId: input.orderId,
            fromStatus: order.status,
            toStatus: order.status,
            changedBy: userId,
            notes: `${updateResult.count} items cleared (served) from ${prepSector.name}`,
          },
        });

        return updateResult;
      });

      return {
        success: true,
        clearedCount: result.count,
        orderId: input.orderId,
        sectorCode: sectorCode,
      };
    }),

  /**
   * Get console statistics for a prep sector.
   *
   * Returns:
   * - activeOrders: Count of orders with items in PENDING, IN_PROGRESS, or READY
   * - avgTicketTime: Average time in seconds for tickets completed in the last 24 hours
   */
  getStats: protectedProcedure
    .use(requirePermission("prep", "view"))
    .input(
      z.object({
        sectorCode: z.string().min(1, "Sector code is required"),
      })
    )
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;
      const userRole = ctx.session.user.role;
      const sectorCode = input.sectorCode.toUpperCase();

      // Validate sector access
      validateSectorAccess(userRole, sectorCode);

      // Find the prep sector
      const prepSector = await prisma.prepSector.findFirst({
        where: {
          tenantId,
          code: sectorCode,
        },
      });

      if (!prepSector) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Prep sector "${input.sectorCode}" not found`,
        });
      }

      // Count active orders (those with items in active statuses)
      const activeOrdersResult = await prisma.orderItem.findMany({
        where: {
          prepSectorId: prepSector.id,
          status: {
            in: ["PENDING", "IN_PROGRESS", "READY"],
          },
          order: {
            tenantId,
            status: {
              notIn: ["CANCELLED", "PAID"],
            },
          },
        },
        select: {
          orderId: true,
        },
        distinct: ["orderId"],
      });

      const activeOrders = activeOrdersResult.length;

      // Calculate average ticket time for items completed in last 24 hours
      // A "completed" item is one that reached SERVED status
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const completedItems = await prisma.orderItem.findMany({
        where: {
          prepSectorId: prepSector.id,
          status: "SERVED",
          updatedAt: {
            gte: twentyFourHoursAgo,
          },
          order: {
            tenantId,
          },
        },
        select: {
          createdAt: true,
          updatedAt: true,
        },
      });

      let avgTicketTime: number | null = null;

      if (completedItems.length > 0) {
        // Calculate average time from creation to completion (served)
        const totalSeconds = completedItems.reduce((sum, item) => {
          const ticketTime = item.updatedAt.getTime() - item.createdAt.getTime();
          return sum + ticketTime / 1000;
        }, 0);

        avgTicketTime = Math.round(totalSeconds / completedItems.length);
      }

      // Get counts by status for additional insight
      const statusCounts = await prisma.orderItem.groupBy({
        by: ["status"],
        where: {
          prepSectorId: prepSector.id,
          status: {
            in: ["PENDING", "IN_PROGRESS", "READY"],
          },
          order: {
            tenantId,
            status: {
              notIn: ["CANCELLED", "PAID"],
            },
          },
        },
        _count: {
          id: true,
        },
      });

      const itemCounts = {
        pending: 0,
        inProgress: 0,
        ready: 0,
      };

      for (const count of statusCounts) {
        switch (count.status) {
          case "PENDING":
            itemCounts.pending = count._count.id;
            break;
          case "IN_PROGRESS":
            itemCounts.inProgress = count._count.id;
            break;
          case "READY":
            itemCounts.ready = count._count.id;
            break;
        }
      }

      return {
        sectorId: prepSector.id,
        sectorCode: prepSector.code,
        sectorName: prepSector.name,
        activeOrders,
        avgTicketTime,
        itemCounts,
        completedLast24h: completedItems.length,
      };
    }),
});

export type PrepStationRouter = typeof prepStationRouter;
