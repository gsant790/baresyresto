import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import {
  router,
  protectedProcedure,
  publicProcedure,
  requirePermission,
} from "@/lib/trpc/init";
import { prisma } from "@/lib/db";

// Decimal type alias for convenience
type Decimal = Prisma.Decimal;

/**
 * Menu (Dishes) Router
 *
 * Handles CRUD operations for dishes in the menu.
 * Dishes belong to categories and can be toggled for availability.
 *
 * Permissions:
 * - ADMIN, SUPER_ADMIN: Full access (view, create, update, delete)
 * - WAITER: View only
 * - COOK, BARTENDER: View only
 */

// Common allergens list for validation hints
export const COMMON_ALLERGENS = [
  "gluten",
  "crustaceans",
  "eggs",
  "fish",
  "peanuts",
  "soybeans",
  "milk",
  "nuts",
  "celery",
  "mustard",
  "sesame",
  "sulphites",
  "lupin",
  "molluscs",
] as const;

// Validation schemas
const createDishSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  nameEn: z.string().max(100).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  descriptionEn: z.string().max(1000).optional().nullable(),
  price: z.number().positive("Price must be positive").max(9999.99),
  categoryId: z.string().cuid("Invalid category"),
  imageUrl: z.string().url("Invalid image URL").optional().nullable(),
  allergens: z.array(z.string().max(50)).max(20).default([]),
  displayOrder: z.number().int().min(0).default(0),
  isAvailable: z.boolean().default(true),
});

const updateDishSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100).optional(),
  nameEn: z.string().max(100).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  descriptionEn: z.string().max(1000).optional().nullable(),
  price: z.number().positive().max(9999.99).optional(),
  categoryId: z.string().cuid().optional(),
  imageUrl: z.string().url().optional().nullable(),
  allergens: z.array(z.string().max(50)).max(20).optional(),
  displayOrder: z.number().int().min(0).optional(),
  isAvailable: z.boolean().optional(),
});

const listDishesSchema = z.object({
  categoryId: z.string().cuid().optional(),
  isAvailable: z.boolean().optional(),
  isInStock: z.boolean().optional(),
  search: z.string().max(100).optional(),
});

export const menuRouter = router({
  /**
   * List all dishes for the current tenant.
   * Supports filtering by category, availability, and search.
   */
  list: protectedProcedure
    .use(requirePermission("menu", "view"))
    .input(listDishesSchema.optional())
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;
      const filters = input ?? {};

      const dishes = await prisma.dish.findMany({
        where: {
          tenantId,
          ...(filters.categoryId && { categoryId: filters.categoryId }),
          ...(filters.isAvailable !== undefined && { isAvailable: filters.isAvailable }),
          ...(filters.isInStock !== undefined && { isInStock: filters.isInStock }),
          ...(filters.search && {
            OR: [
              { name: { contains: filters.search, mode: "insensitive" } },
              { nameEn: { contains: filters.search, mode: "insensitive" } },
              { description: { contains: filters.search, mode: "insensitive" } },
            ],
          }),
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              prepSector: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
        },
        orderBy: [{ category: { displayOrder: "asc" } }, { displayOrder: "asc" }, { name: "asc" }],
      });

      return dishes.map((dish) => ({
        ...dish,
        price: dish.price.toNumber(),
      }));
    }),

  /**
   * Get a single dish by ID.
   */
  getById: protectedProcedure
    .use(requirePermission("menu", "view"))
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;

      const dish = await prisma.dish.findFirst({
        where: { id: input.id, tenantId },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              prepSector: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
          ingredients: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  unit: true,
                  quantity: true,
                },
              },
            },
          },
        },
      });

      if (!dish) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Dish not found",
        });
      }

      return {
        ...dish,
        price: dish.price.toNumber(),
        ingredients: dish.ingredients.map((ing) => ({
          ...ing,
          quantityNeeded: ing.quantityNeeded.toNumber(),
          product: {
            ...ing.product,
            quantity: ing.product.quantity.toNumber(),
          },
        })),
      };
    }),

  /**
   * Create a new dish.
   */
  create: protectedProcedure
    .use(requirePermission("menu", "create"))
    .input(createDishSchema)
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;

      // Verify category exists and belongs to tenant
      const category = await prisma.category.findFirst({
        where: { id: input.categoryId, tenantId },
      });

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      // Check if dish name already exists
      const existing = await prisma.dish.findUnique({
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
          message: `Dish "${input.name}" already exists`,
        });
      }

      // Get the max display order within category if not provided
      let displayOrder = input.displayOrder;
      if (displayOrder === 0) {
        const maxOrder = await prisma.dish.findFirst({
          where: { tenantId, categoryId: input.categoryId },
          orderBy: { displayOrder: "desc" },
          select: { displayOrder: true },
        });
        displayOrder = (maxOrder?.displayOrder ?? 0) + 1;
      }

      const dish = await prisma.dish.create({
        data: {
          tenantId,
          name: input.name,
          nameEn: input.nameEn,
          description: input.description,
          descriptionEn: input.descriptionEn,
          price: new Prisma.Decimal(input.price),
          categoryId: input.categoryId,
          imageUrl: input.imageUrl,
          allergens: input.allergens,
          displayOrder,
          isAvailable: input.isAvailable,
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              prepSector: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
        },
      });

      return {
        ...dish,
        price: dish.price.toNumber(),
      };
    }),

  /**
   * Update an existing dish.
   */
  update: protectedProcedure
    .use(requirePermission("menu", "update"))
    .input(updateDishSchema)
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;
      const { id, ...data } = input;

      // Verify dish belongs to tenant
      const existing = await prisma.dish.findFirst({
        where: { id, tenantId },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Dish not found",
        });
      }

      // If updating category, verify it exists
      if (data.categoryId) {
        const category = await prisma.category.findFirst({
          where: { id: data.categoryId, tenantId },
        });

        if (!category) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Category not found",
          });
        }
      }

      // Check for duplicate name if changing
      if (data.name && data.name !== existing.name) {
        const duplicate = await prisma.dish.findUnique({
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
            message: `Dish "${data.name}" already exists`,
          });
        }
      }

      // Convert price to Decimal if provided
      const updateData = {
        ...data,
        ...(data.price !== undefined && { price: new Prisma.Decimal(data.price) }),
      };

      const dish = await prisma.dish.update({
        where: { id },
        data: updateData,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              prepSector: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
        },
      });

      return {
        ...dish,
        price: dish.price.toNumber(),
      };
    }),

  /**
   * Toggle dish availability (manual toggle).
   */
  toggleAvailable: protectedProcedure
    .use(requirePermission("menu", "update"))
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;

      const existing = await prisma.dish.findFirst({
        where: { id: input.id, tenantId },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Dish not found",
        });
      }

      const dish = await prisma.dish.update({
        where: { id: input.id },
        data: { isAvailable: !existing.isAvailable },
      });

      return {
        ...dish,
        price: dish.price.toNumber(),
      };
    }),

  /**
   * Set dish stock status (typically called by inventory system).
   */
  setStockStatus: protectedProcedure
    .use(requirePermission("menu", "update"))
    .input(
      z.object({
        id: z.string().cuid(),
        isInStock: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;

      const existing = await prisma.dish.findFirst({
        where: { id: input.id, tenantId },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Dish not found",
        });
      }

      const dish = await prisma.dish.update({
        where: { id: input.id },
        data: { isInStock: input.isInStock },
      });

      return {
        ...dish,
        price: dish.price.toNumber(),
      };
    }),

  /**
   * Delete a dish.
   */
  delete: protectedProcedure
    .use(requirePermission("menu", "delete"))
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;

      const existing = await prisma.dish.findFirst({
        where: { id: input.id, tenantId },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Dish not found",
        });
      }

      await prisma.dish.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Get menu stats (dish counts by status).
   */
  getStats: protectedProcedure
    .use(requirePermission("menu", "view"))
    .query(async ({ ctx }) => {
      const tenantId = ctx.session.user.tenantId;

      const [total, available, unavailable, outOfStock, categories] = await Promise.all([
        prisma.dish.count({ where: { tenantId } }),
        prisma.dish.count({ where: { tenantId, isAvailable: true, isInStock: true } }),
        prisma.dish.count({ where: { tenantId, isAvailable: false } }),
        prisma.dish.count({ where: { tenantId, isInStock: false } }),
        prisma.category.count({ where: { tenantId } }),
      ]);

      return {
        total,
        available,
        unavailable,
        outOfStock,
        categories,
      };
    }),

  /**
   * Public endpoint to get menu for customer ordering.
   */
  getPublicMenu: publicProcedure
    .input(
      z.object({
        tenantSlug: z.string(),
        categoryId: z.string().cuid().optional(),
      })
    )
    .query(async ({ input }) => {
      const tenant = await prisma.tenant.findUnique({
        where: { slug: input.tenantSlug, isActive: true },
      });

      if (!tenant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Restaurant not found",
        });
      }

      const dishes = await prisma.dish.findMany({
        where: {
          tenantId: tenant.id,
          isAvailable: true,
          isInStock: true,
          ...(input.categoryId && { categoryId: input.categoryId }),
        },
        select: {
          id: true,
          name: true,
          nameEn: true,
          description: true,
          descriptionEn: true,
          price: true,
          imageUrl: true,
          allergens: true,
          category: {
            select: {
              id: true,
              name: true,
              nameEn: true,
            },
          },
        },
        orderBy: [{ category: { displayOrder: "asc" } }, { displayOrder: "asc" }],
      });

      return dishes.map((dish) => ({
        ...dish,
        price: dish.price.toNumber(),
      }));
    }),
});

export type MenuRouter = typeof menuRouter;
