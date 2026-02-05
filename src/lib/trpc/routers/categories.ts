import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  router,
  protectedProcedure,
  publicProcedure,
  requirePermission,
} from "@/lib/trpc/init";
import { prisma } from "@/lib/db";
import { createTenantScope } from "@/lib/tenant";

/**
 * Categories Router
 *
 * Handles CRUD operations for menu categories.
 * Each category is assigned to a prep sector for order routing.
 *
 * Permissions:
 * - ADMIN, SUPER_ADMIN: Full access (view, create, update, delete)
 * - WAITER: View only
 * - COOK, BARTENDER: View only
 */

// Validation schemas
const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  nameEn: z.string().max(100).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  prepSectorId: z.string().cuid("Invalid prep sector"),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

const updateCategorySchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100).optional(),
  nameEn: z.string().max(100).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  prepSectorId: z.string().cuid().optional(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

const reorderCategoriesSchema = z.object({
  categoryIds: z.array(z.string().cuid()),
});

export const categoriesRouter = router({
  /**
   * List all categories for the current tenant.
   * Includes prep sector info and dish count.
   */
  list: protectedProcedure
    .use(requirePermission("menu", "view"))
    .query(async ({ ctx }) => {
      const tenantId = ctx.session.user.tenantId;

      const categories = await prisma.category.findMany({
        where: { tenantId },
        include: {
          prepSector: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          _count: {
            select: { dishes: true },
          },
        },
        orderBy: { displayOrder: "asc" },
      });

      return categories.map((category) => ({
        ...category,
        dishCount: category._count.dishes,
      }));
    }),

  /**
   * List active categories only.
   */
  listActive: protectedProcedure
    .use(requirePermission("menu", "view"))
    .query(async ({ ctx }) => {
      const tenantId = ctx.session.user.tenantId;

      const categories = await prisma.category.findMany({
        where: { tenantId, isActive: true },
        include: {
          prepSector: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
        orderBy: { displayOrder: "asc" },
      });

      return categories;
    }),

  /**
   * Get a single category by ID.
   */
  getById: protectedProcedure
    .use(requirePermission("menu", "view"))
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;

      const category = await prisma.category.findFirst({
        where: { id: input.id, tenantId },
        include: {
          prepSector: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          _count: {
            select: { dishes: true },
          },
        },
      });

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      return {
        ...category,
        dishCount: category._count.dishes,
      };
    }),

  /**
   * Create a new category.
   */
  create: protectedProcedure
    .use(requirePermission("menu", "create"))
    .input(createCategorySchema)
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;

      // Verify prep sector exists and belongs to tenant
      const prepSector = await prisma.prepSector.findFirst({
        where: { id: input.prepSectorId, tenantId },
      });

      if (!prepSector) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prep sector not found",
        });
      }

      // Check if category name already exists
      const existing = await prisma.category.findUnique({
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
          message: `Category "${input.name}" already exists`,
        });
      }

      // Get the max display order if not provided
      let displayOrder = input.displayOrder;
      if (displayOrder === 0) {
        const maxOrder = await prisma.category.findFirst({
          where: { tenantId },
          orderBy: { displayOrder: "desc" },
          select: { displayOrder: true },
        });
        displayOrder = (maxOrder?.displayOrder ?? 0) + 1;
      }

      const category = await prisma.category.create({
        data: {
          tenantId,
          name: input.name,
          nameEn: input.nameEn,
          description: input.description,
          prepSectorId: input.prepSectorId,
          displayOrder,
          isActive: input.isActive,
        },
        include: {
          prepSector: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      return category;
    }),

  /**
   * Update an existing category.
   */
  update: protectedProcedure
    .use(requirePermission("menu", "update"))
    .input(updateCategorySchema)
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;
      const { id, ...data } = input;

      // Verify category belongs to tenant
      const existing = await prisma.category.findFirst({
        where: { id, tenantId },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      // If updating prep sector, verify it exists
      if (data.prepSectorId) {
        const prepSector = await prisma.prepSector.findFirst({
          where: { id: data.prepSectorId, tenantId },
        });

        if (!prepSector) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Prep sector not found",
          });
        }
      }

      // Check for duplicate name if changing
      if (data.name && data.name !== existing.name) {
        const duplicate = await prisma.category.findUnique({
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
            message: `Category "${data.name}" already exists`,
          });
        }
      }

      const category = await prisma.category.update({
        where: { id },
        data,
        include: {
          prepSector: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      return category;
    }),

  /**
   * Toggle category active status.
   */
  toggleActive: protectedProcedure
    .use(requirePermission("menu", "update"))
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;

      const existing = await prisma.category.findFirst({
        where: { id: input.id, tenantId },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      const category = await prisma.category.update({
        where: { id: input.id },
        data: { isActive: !existing.isActive },
      });

      return category;
    }),

  /**
   * Reorder categories by updating their displayOrder.
   */
  reorder: protectedProcedure
    .use(requirePermission("menu", "update"))
    .input(reorderCategoriesSchema)
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;

      // Verify all categories belong to tenant
      const categories = await prisma.category.findMany({
        where: {
          id: { in: input.categoryIds },
          tenantId,
        },
        select: { id: true },
      });

      if (categories.length !== input.categoryIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Some categories were not found",
        });
      }

      // Update display order for each category
      await Promise.all(
        input.categoryIds.map((id, index) =>
          prisma.category.update({
            where: { id },
            data: { displayOrder: index },
          })
        )
      );

      return { success: true };
    }),

  /**
   * Delete a category.
   * Will fail if there are dishes assigned to it.
   */
  delete: protectedProcedure
    .use(requirePermission("menu", "delete"))
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;

      const existing = await prisma.category.findFirst({
        where: { id: input.id, tenantId },
        include: {
          dishes: { select: { id: true }, take: 1 },
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      // Check if there are dishes assigned
      if (existing.dishes.length > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Cannot delete category with assigned dishes. Reassign or delete the dishes first.",
        });
      }

      await prisma.category.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Public endpoint to list categories for a tenant (customer menu).
   */
  listPublic: publicProcedure
    .input(z.object({ tenantSlug: z.string() }))
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

      const categories = await prisma.category.findMany({
        where: { tenantId: tenant.id, isActive: true },
        select: {
          id: true,
          name: true,
          nameEn: true,
          description: true,
          displayOrder: true,
        },
        orderBy: { displayOrder: "asc" },
      });

      return categories;
    }),
});

export type CategoriesRouter = typeof categoriesRouter;
