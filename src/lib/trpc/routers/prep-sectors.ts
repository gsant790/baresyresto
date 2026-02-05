import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  router,
  protectedProcedure,
  requirePermission,
} from "@/lib/trpc/init";
import { prisma } from "@/lib/db";
import { createTenantScope } from "@/lib/tenant";

/**
 * PrepSectors Router
 *
 * Handles CRUD operations for preparation sectors (Kitchen, Bar, etc.).
 * PrepSectors define where order items are routed for preparation.
 *
 * Permissions:
 * - ADMIN, SUPER_ADMIN: Full access (view, create, update, delete)
 * - WAITER: View only
 * - COOK, BARTENDER: View only (to see their assigned sectors)
 */

// Validation schemas
const createPrepSectorSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  code: z
    .string()
    .min(1, "Code is required")
    .max(20)
    .toUpperCase()
    .regex(/^[A-Z_]+$/, "Code must contain only uppercase letters and underscores"),
});

const updatePrepSectorSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100).optional(),
  code: z
    .string()
    .min(1)
    .max(20)
    .toUpperCase()
    .regex(/^[A-Z_]+$/, "Code must contain only uppercase letters and underscores")
    .optional(),
});

export const prepSectorsRouter = router({
  /**
   * List all prep sectors for the current tenant.
   */
  list: protectedProcedure
    .use(requirePermission("menu", "view"))
    .query(async ({ ctx }) => {
      const tenantScope = createTenantScope(ctx.session.user.tenantId);

      const prepSectors = await tenantScope.prepSector.findMany({
        orderBy: { name: "asc" },
      });

      return prepSectors;
    }),

  /**
   * Get a single prep sector by ID.
   */
  getById: protectedProcedure
    .use(requirePermission("menu", "view"))
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;

      const prepSector = await prisma.prepSector.findFirst({
        where: { id: input.id, tenantId },
      });

      if (!prepSector) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prep sector not found",
        });
      }

      return prepSector;
    }),

  /**
   * Get a prep sector by code.
   */
  getByCode: protectedProcedure
    .use(requirePermission("menu", "view"))
    .input(z.object({ code: z.string() }))
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;

      const prepSector = await prisma.prepSector.findUnique({
        where: {
          tenantId_code: {
            tenantId,
            code: input.code.toUpperCase(),
          },
        },
      });

      if (!prepSector) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prep sector not found",
        });
      }

      return prepSector;
    }),

  /**
   * Create a new prep sector.
   */
  create: protectedProcedure
    .use(requirePermission("menu", "create"))
    .input(createPrepSectorSchema)
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;
      const code = input.code.toUpperCase();

      // Check if code already exists for this tenant
      const existing = await prisma.prepSector.findUnique({
        where: {
          tenantId_code: {
            tenantId,
            code,
          },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Prep sector with code "${code}" already exists`,
        });
      }

      const prepSector = await prisma.prepSector.create({
        data: {
          tenantId,
          name: input.name,
          code,
        },
      });

      return prepSector;
    }),

  /**
   * Update an existing prep sector.
   */
  update: protectedProcedure
    .use(requirePermission("menu", "update"))
    .input(updatePrepSectorSchema)
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;
      const { id, ...data } = input;

      // Verify prep sector belongs to tenant
      const existing = await prisma.prepSector.findFirst({
        where: { id, tenantId },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prep sector not found",
        });
      }

      // Check for duplicate code if changing
      if (data.code && data.code !== existing.code) {
        const duplicate = await prisma.prepSector.findUnique({
          where: {
            tenantId_code: {
              tenantId,
              code: data.code,
            },
          },
        });

        if (duplicate) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Prep sector with code "${data.code}" already exists`,
          });
        }
      }

      const prepSector = await prisma.prepSector.update({
        where: { id },
        data,
      });

      return prepSector;
    }),

  /**
   * Delete a prep sector.
   * Will fail if there are categories assigned to it.
   */
  delete: protectedProcedure
    .use(requirePermission("menu", "delete"))
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;

      // Verify prep sector belongs to tenant
      const existing = await prisma.prepSector.findFirst({
        where: { id: input.id, tenantId },
        include: {
          categories: { select: { id: true }, take: 1 },
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prep sector not found",
        });
      }

      // Check if there are categories assigned
      if (existing.categories.length > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Cannot delete prep sector with assigned categories. Reassign or delete the categories first.",
        });
      }

      await prisma.prepSector.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Get stats for prep sectors (category and dish counts).
   */
  getStats: protectedProcedure
    .use(requirePermission("menu", "view"))
    .query(async ({ ctx }) => {
      const tenantId = ctx.session.user.tenantId;

      const prepSectors = await prisma.prepSector.findMany({
        where: { tenantId },
        include: {
          _count: {
            select: {
              categories: true,
              orderItems: true,
            },
          },
        },
        orderBy: { name: "asc" },
      });

      return prepSectors.map((sector) => ({
        id: sector.id,
        name: sector.name,
        code: sector.code,
        categoryCount: sector._count.categories,
        orderItemCount: sector._count.orderItems,
      }));
    }),
});

export type PrepSectorsRouter = typeof prepSectorsRouter;
