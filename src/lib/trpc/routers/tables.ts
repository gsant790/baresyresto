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
import { generateTableCode, buildTableUrl } from "@/lib/qr";
import { TableStatus } from "@prisma/client";

/**
 * Tables Router
 *
 * Handles CRUD operations for restaurant tables.
 * Each table has a unique QR code for customer ordering.
 *
 * Permissions:
 * - ADMIN, SUPER_ADMIN: Full access (view, create, update, delete)
 * - WAITER: View and update status only
 * - COOK, BARTENDER: No access
 */

// Validation schemas
const createTableSchema = z.object({
  number: z.number().int().positive("Table number must be positive"),
  name: z.string().optional(),
  capacity: z.number().int().min(1).max(50).default(4),
  zone: z.string().optional(),
});

const updateTableSchema = z.object({
  id: z.string().cuid(),
  number: z.number().int().positive("Table number must be positive").optional(),
  name: z.string().optional().nullable(),
  capacity: z.number().int().min(1).max(50).optional(),
  zone: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

const updateStatusSchema = z.object({
  id: z.string().cuid(),
  status: z.nativeEnum(TableStatus),
});

export const tablesRouter = router({
  /**
   * List all tables for the current tenant.
   * Returns tables sorted by zone and number.
   */
  list: protectedProcedure
    .use(requirePermission("tables", "view"))
    .query(async ({ ctx }) => {
      const tenantScope = createTenantScope(ctx.session.user.tenantId);

      const tables = await tenantScope.table.findMany({
        orderBy: [{ zone: "asc" }, { number: "asc" }],
      });

      return tables;
    }),

  /**
   * Get a single table by ID.
   */
  getById: protectedProcedure
    .use(requirePermission("tables", "view"))
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const tenantScope = createTenantScope(ctx.session.user.tenantId);

      const table = await tenantScope.table.findFirst({
        where: { id: input.id, isActive: true },
      });

      if (!table) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Table not found",
        });
      }

      return table;
    }),

  /**
   * Get tables filtered by status.
   * Useful for showing available tables or those needing attention.
   */
  getByStatus: protectedProcedure
    .use(requirePermission("tables", "view"))
    .input(z.object({ status: z.nativeEnum(TableStatus) }))
    .query(async ({ ctx, input }) => {
      const tenantScope = createTenantScope(ctx.session.user.tenantId);

      const tables = await tenantScope.table.findMany({
        where: { status: input.status, isActive: true },
        orderBy: [{ zone: "asc" }, { number: "asc" }],
      });

      return tables;
    }),

  /**
   * Get table statistics by status.
   * Returns counts for each status category.
   */
  getStats: protectedProcedure
    .use(requirePermission("tables", "view"))
    .query(async ({ ctx }) => {
      const tenantId = ctx.session.user.tenantId;

      // Get counts for each status
      const [available, occupied, reserved, cleaning, total] = await Promise.all([
        prisma.table.count({
          where: { tenantId, status: "AVAILABLE", isActive: true },
        }),
        prisma.table.count({
          where: { tenantId, status: "OCCUPIED", isActive: true },
        }),
        prisma.table.count({
          where: { tenantId, status: "RESERVED", isActive: true },
        }),
        prisma.table.count({
          where: { tenantId, status: "CLEANING", isActive: true },
        }),
        prisma.table.count({
          where: { tenantId, isActive: true },
        }),
      ]);

      return {
        available,
        occupied,
        reserved,
        cleaning,
        total,
      };
    }),

  /**
   * Create a new table with a unique QR code.
   * The QR code is generated automatically and must be globally unique.
   */
  create: protectedProcedure
    .use(requirePermission("tables", "create"))
    .input(createTableSchema)
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;

      // Check if table number already exists for this tenant
      const existing = await prisma.table.findUnique({
        where: {
          tenantId_number: {
            tenantId,
            number: input.number,
          },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Table ${input.number} already exists`,
        });
      }

      // Generate unique QR code with retry logic
      let qrCode: string;
      let attempts = 0;
      const maxAttempts = 5;

      do {
        qrCode = generateTableCode();
        const existingQr = await prisma.table.findUnique({
          where: { qrCode },
        });
        if (!existingQr) break;
        attempts++;
      } while (attempts < maxAttempts);

      if (attempts >= maxAttempts) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate unique QR code. Please try again.",
        });
      }

      const table = await prisma.table.create({
        data: {
          tenantId,
          number: input.number,
          name: input.name,
          capacity: input.capacity,
          zone: input.zone,
          qrCode,
          status: "AVAILABLE",
        },
      });

      return table;
    }),

  /**
   * Update table details (not status).
   * Status changes use the updateStatus mutation for better tracking.
   */
  update: protectedProcedure
    .use(requirePermission("tables", "update"))
    .input(updateTableSchema)
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;
      const { id, ...data } = input;

      // Verify table belongs to tenant
      const existing = await prisma.table.findFirst({
        where: { id, tenantId },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Table not found",
        });
      }

      // Check for duplicate number if changing
      if (data.number && data.number !== existing.number) {
        const duplicate = await prisma.table.findUnique({
          where: {
            tenantId_number: {
              tenantId,
              number: data.number,
            },
          },
        });

        if (duplicate) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Table ${data.number} already exists`,
          });
        }
      }

      // Use updateMany with tenantId to prevent TOCTOU race condition
      const result = await prisma.table.updateMany({
        where: { id, tenantId },
        data,
      });

      if (result.count === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Table not found or access denied",
        });
      }

      // Fetch the updated table
      const table = await prisma.table.findUnique({
        where: { id },
      });

      return table!;
    }),

  /**
   * Update table status only.
   * Separated from general updates for workflow clarity.
   */
  updateStatus: protectedProcedure
    .use(requirePermission("tables", "update"))
    .input(updateStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;

      // Verify table belongs to tenant
      const existing = await prisma.table.findFirst({
        where: { id: input.id, tenantId },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Table not found",
        });
      }

      // Use updateMany with tenantId to prevent TOCTOU race condition
      const result = await prisma.table.updateMany({
        where: { id: input.id, tenantId },
        data: { status: input.status },
      });

      if (result.count === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Table not found or access denied",
        });
      }

      // Fetch the updated table
      const table = await prisma.table.findUnique({
        where: { id: input.id },
      });

      return table!;
    }),

  /**
   * Soft delete a table by marking it inactive.
   * This preserves historical data integrity for orders.
   */
  delete: protectedProcedure
    .use(requirePermission("tables", "delete"))
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;

      // Verify table belongs to tenant
      const existing = await prisma.table.findFirst({
        where: { id: input.id, tenantId },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Table not found",
        });
      }

      // Soft delete
      await prisma.table.update({
        where: { id: input.id },
        data: { isActive: false },
      });

      return { success: true };
    }),

  /**
   * Regenerate the QR code for a table.
   * Useful if the existing code is compromised or damaged.
   */
  regenerateQrCode: protectedProcedure
    .use(requirePermission("tables", "update"))
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;

      // Verify table belongs to tenant
      const existing = await prisma.table.findFirst({
        where: { id: input.id, tenantId },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Table not found",
        });
      }

      // Generate new unique QR code
      let qrCode: string;
      let attempts = 0;
      const maxAttempts = 5;

      do {
        qrCode = generateTableCode();
        const existingQr = await prisma.table.findUnique({
          where: { qrCode },
        });
        if (!existingQr) break;
        attempts++;
      } while (attempts < maxAttempts);

      if (attempts >= maxAttempts) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate unique QR code. Please try again.",
        });
      }

      const table = await prisma.table.update({
        where: { id: input.id },
        data: { qrCode },
      });

      return table;
    }),

  /**
   * Get the menu URL for a table.
   * Used to generate and display QR codes.
   */
  getMenuUrl: protectedProcedure
    .use(requirePermission("tables", "view"))
    .input(
      z.object({
        id: z.string().cuid(),
        locale: z.string().default("es"),
      })
    )
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;
      const tenantSlug = ctx.session.user.tenantSlug;

      const table = await prisma.table.findFirst({
        where: { id: input.id, tenantId },
      });

      if (!table) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Table not found",
        });
      }

      return {
        url: buildTableUrl(tenantSlug, table.qrCode, input.locale),
        qrCode: table.qrCode,
      };
    }),

  /**
   * Public endpoint to get table by QR code.
   * Used by customers when scanning a table QR code.
   * No authentication required.
   */
  getByQrCode: publicProcedure
    .input(
      z.object({
        tenantSlug: z.string(),
        qrCode: z.string().length(6),
      })
    )
    .query(async ({ input }) => {
      // Find tenant first
      const tenant = await prisma.tenant.findUnique({
        where: { slug: input.tenantSlug, isActive: true },
      });

      if (!tenant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Restaurant not found",
        });
      }

      // Find table by QR code within tenant
      const table = await prisma.table.findFirst({
        where: {
          tenantId: tenant.id,
          qrCode: input.qrCode,
          isActive: true,
        },
        select: {
          id: true,
          number: true,
          name: true,
          status: true,
        },
      });

      if (!table) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Table not found",
        });
      }

      return {
        table,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
        },
      };
    }),
});

export type TablesRouter = typeof tablesRouter;
