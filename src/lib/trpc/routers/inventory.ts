import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  router,
  protectedProcedure,
  requirePermission,
} from "@/lib/trpc/init";
import { prisma } from "@/lib/db";
import { createTenantScope } from "@/lib/tenant";
import { Unit, Prisma } from "@prisma/client";

/**
 * Inventory Router
 *
 * Handles CRUD operations for inventory products.
 * Products track stock quantities and alert thresholds for low-stock notifications.
 *
 * Permissions:
 * - ADMIN, SUPER_ADMIN: Full access (view, create, update, delete)
 * - COOK, BARTENDER: View only
 * - WAITER: No access
 */

// Validation schemas
const createProductSchema = z.object({
  name: z
    .string()
    .min(1, "Product name is required")
    .max(100, "Product name must be 100 characters or less"),
  unit: z.nativeEnum(Unit),
  quantity: z
    .number()
    .min(0, "Quantity cannot be negative")
    .transform((val) => new Prisma.Decimal(val)),
  alertThreshold: z
    .number()
    .min(0, "Alert threshold cannot be negative")
    .transform((val) => new Prisma.Decimal(val)),
  costPerUnit: z
    .number()
    .min(0, "Cost per unit cannot be negative")
    .optional()
    .nullable()
    .transform((val) => (val != null ? new Prisma.Decimal(val) : null)),
});

const updateProductSchema = z.object({
  id: z.string().cuid(),
  name: z
    .string()
    .min(1, "Product name is required")
    .max(100, "Product name must be 100 characters or less")
    .optional(),
  unit: z.nativeEnum(Unit).optional(),
  quantity: z
    .number()
    .min(0, "Quantity cannot be negative")
    .optional()
    .transform((val) => (val != null ? new Prisma.Decimal(val) : undefined)),
  alertThreshold: z
    .number()
    .min(0, "Alert threshold cannot be negative")
    .optional()
    .transform((val) => (val != null ? new Prisma.Decimal(val) : undefined)),
  costPerUnit: z
    .number()
    .min(0, "Cost per unit cannot be negative")
    .optional()
    .nullable()
    .transform((val) =>
      val === undefined ? undefined : val === null ? null : new Prisma.Decimal(val)
    ),
  isActive: z.boolean().optional(),
});

const adjustQuantitySchema = z.object({
  id: z.string().cuid(),
  adjustment: z.number().refine((val) => val !== 0, "Adjustment cannot be zero"),
  reason: z.string().max(255).optional(),
});

const listProductsSchema = z.object({
  search: z.string().optional(),
  unit: z.nativeEnum(Unit).optional(),
  lowStockOnly: z.boolean().optional(),
  includeInactive: z.boolean().optional(),
  sortBy: z.enum(["name", "quantity", "alertThreshold", "updatedAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  cursor: z.string().cuid().optional(),
});

export const inventoryRouter = router({
  /**
   * List all products for the current tenant.
   * Supports filtering, searching, and pagination.
   */
  list: protectedProcedure
    .use(requirePermission("inventory", "view"))
    .input(listProductsSchema.optional())
    .query(async ({ ctx, input }) => {
      const tenantScope = createTenantScope(ctx.session.user.tenantId);
      const {
        search,
        unit,
        lowStockOnly,
        includeInactive = false,
        sortBy = "name",
        sortOrder = "asc",
        limit = 50,
        cursor,
      } = input ?? {};

      // Build where clause for filtering
      const where: Prisma.ProductWhereInput = {};

      if (!includeInactive) {
        where.isActive = true;
      }

      if (search) {
        where.name = {
          contains: search,
          mode: "insensitive",
        };
      }

      if (unit) {
        where.unit = unit;
      }

      // Low stock filter: quantity <= alertThreshold
      // Note: This requires a raw query or post-filtering for Prisma
      // We'll handle this in the query result

      const products = await tenantScope.product.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        take: limit + 1, // Fetch one extra to determine if there are more
        ...(cursor && { skip: 1, cursor: { id: cursor } }),
      });

      // Determine if there are more results
      let nextCursor: string | undefined;
      if (products.length > limit) {
        const nextItem = products.pop();
        nextCursor = nextItem?.id;
      }

      // Filter for low stock if requested
      const filteredProducts = lowStockOnly
        ? products.filter(
            (p) =>
              Number(p.quantity) <= Number(p.alertThreshold)
          )
        : products;

      // Add computed stock status to each product
      const productsWithStatus = filteredProducts.map((product) => ({
        ...product,
        stockStatus: getStockStatus(
          Number(product.quantity),
          Number(product.alertThreshold)
        ),
      }));

      return {
        products: productsWithStatus,
        nextCursor,
      };
    }),

  /**
   * Get a single product by ID.
   */
  getById: protectedProcedure
    .use(requirePermission("inventory", "view"))
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const tenantScope = createTenantScope(ctx.session.user.tenantId);

      const product = await tenantScope.product.findFirst({
        where: { id: input.id },
      });

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      return {
        ...product,
        stockStatus: getStockStatus(
          Number(product.quantity),
          Number(product.alertThreshold)
        ),
      };
    }),

  /**
   * Get products with low stock.
   * Returns products where quantity <= alertThreshold.
   */
  getLowStock: protectedProcedure
    .use(requirePermission("inventory", "view"))
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(100).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;
      const limit = input?.limit ?? 50;

      // Use raw query to compare quantity with alertThreshold
      // This is more efficient than fetching all products and filtering
      const lowStockProducts = await prisma.$queryRaw<
        Array<{
          id: string;
          name: string;
          unit: Unit;
          quantity: Prisma.Decimal;
          alertThreshold: Prisma.Decimal;
          costPerUnit: Prisma.Decimal | null;
          isActive: boolean;
          tenantId: string;
          createdAt: Date;
          updatedAt: Date;
        }>
      >`
        SELECT *
        FROM "Product"
        WHERE "tenantId" = ${tenantId}
          AND "isActive" = true
          AND quantity <= "alertThreshold"
        ORDER BY (quantity / NULLIF("alertThreshold", 0)) ASC NULLS LAST, name ASC
        LIMIT ${limit}
      `;

      // Add stock status
      const productsWithStatus = lowStockProducts.map((product) => ({
        ...product,
        stockStatus: getStockStatus(
          Number(product.quantity),
          Number(product.alertThreshold)
        ),
      }));

      return productsWithStatus;
    }),

  /**
   * Get inventory statistics.
   * Returns counts for stock status categories.
   */
  getStats: protectedProcedure
    .use(requirePermission("inventory", "view"))
    .query(async ({ ctx }) => {
      const tenantId = ctx.session.user.tenantId;

      // Get all active products to calculate stats
      const products = await prisma.product.findMany({
        where: { tenantId, isActive: true },
        select: { quantity: true, alertThreshold: true },
      });

      let inStock = 0;
      let lowStock = 0;
      let outOfStock = 0;

      for (const product of products) {
        const quantity = Number(product.quantity);
        const threshold = Number(product.alertThreshold);

        if (quantity === 0) {
          outOfStock++;
        } else if (quantity <= threshold) {
          lowStock++;
        } else {
          inStock++;
        }
      }

      return {
        total: products.length,
        inStock,
        lowStock,
        outOfStock,
      };
    }),

  /**
   * Create a new product.
   */
  create: protectedProcedure
    .use(requirePermission("inventory", "create"))
    .input(createProductSchema)
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;

      // Check if product name already exists for this tenant
      const existing = await prisma.product.findUnique({
        where: {
          tenantId_name: {
            tenantId,
            name: input.name,
          },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Product "${input.name}" already exists`,
        });
      }

      const product = await prisma.product.create({
        data: {
          tenantId,
          name: input.name,
          unit: input.unit,
          quantity: input.quantity,
          alertThreshold: input.alertThreshold,
          costPerUnit: input.costPerUnit,
        },
      });

      return {
        ...product,
        stockStatus: getStockStatus(
          Number(product.quantity),
          Number(product.alertThreshold)
        ),
      };
    }),

  /**
   * Update product details.
   */
  update: protectedProcedure
    .use(requirePermission("inventory", "update"))
    .input(updateProductSchema)
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;
      const { id, ...data } = input;

      // Verify product belongs to tenant
      const existing = await prisma.product.findFirst({
        where: { id, tenantId },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      // Check for duplicate name if changing
      if (data.name && data.name !== existing.name) {
        const duplicate = await prisma.product.findUnique({
          where: {
            tenantId_name: {
              tenantId,
              name: data.name,
            },
          },
        });

        if (duplicate) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Product "${data.name}" already exists`,
          });
        }
      }

      // Filter out undefined values
      const updateData: Prisma.ProductUpdateInput = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.unit !== undefined) updateData.unit = data.unit;
      if (data.quantity !== undefined) updateData.quantity = data.quantity;
      if (data.alertThreshold !== undefined) updateData.alertThreshold = data.alertThreshold;
      if (data.costPerUnit !== undefined) updateData.costPerUnit = data.costPerUnit;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      const product = await prisma.product.update({
        where: { id },
        data: updateData,
      });

      return {
        ...product,
        stockStatus: getStockStatus(
          Number(product.quantity),
          Number(product.alertThreshold)
        ),
      };
    }),

  /**
   * Adjust product quantity (add or subtract).
   * Used for stock adjustments without full update.
   */
  adjustQuantity: protectedProcedure
    .use(requirePermission("inventory", "update"))
    .input(adjustQuantitySchema)
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;

      // Verify product belongs to tenant
      const existing = await prisma.product.findFirst({
        where: { id: input.id, tenantId },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      const newQuantity = Number(existing.quantity) + input.adjustment;

      if (newQuantity < 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Adjustment would result in negative quantity",
        });
      }

      const product = await prisma.product.update({
        where: { id: input.id },
        data: {
          quantity: new Prisma.Decimal(newQuantity),
        },
      });

      return {
        ...product,
        stockStatus: getStockStatus(
          Number(product.quantity),
          Number(product.alertThreshold)
        ),
        previousQuantity: Number(existing.quantity),
        adjustment: input.adjustment,
      };
    }),

  /**
   * Soft delete a product by marking it inactive.
   * Preserves historical data integrity for recipes and orders.
   */
  delete: protectedProcedure
    .use(requirePermission("inventory", "delete"))
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;

      // Verify product belongs to tenant
      const existing = await prisma.product.findFirst({
        where: { id: input.id, tenantId },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      // Soft delete
      await prisma.product.update({
        where: { id: input.id },
        data: { isActive: false },
      });

      return { success: true };
    }),

  /**
   * Permanently delete a product.
   * Only use when the product has no references.
   */
  hardDelete: protectedProcedure
    .use(requirePermission("inventory", "delete"))
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;

      // Verify product belongs to tenant
      const existing = await prisma.product.findFirst({
        where: { id: input.id, tenantId },
        include: {
          dishIngredients: { take: 1 },
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      // Check for references
      if (existing.dishIngredients.length > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "Cannot permanently delete product that is used in dish recipes. Deactivate it instead.",
        });
      }

      await prisma.product.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});

/**
 * Helper function to determine stock status based on quantity and threshold.
 */
function getStockStatus(
  quantity: number,
  alertThreshold: number
): "in-stock" | "low-stock" | "out-of-stock" {
  if (quantity === 0) {
    return "out-of-stock";
  }
  if (quantity <= alertThreshold) {
    return "low-stock";
  }
  return "in-stock";
}

export type InventoryRouter = typeof inventoryRouter;
