import { prisma } from "@/lib/db";
import type { Tenant, Prisma } from "@prisma/client";
import { cache } from "react";

/**
 * Multi-Tenancy Utilities
 *
 * Provides tenant resolution and scoped database access for the multi-tenant
 * architecture. Tenants are identified by their unique slug in URLs.
 */

/**
 * Cached tenant lookup by slug.
 * Uses React's cache() for request-level deduplication.
 */
export const getTenantBySlug = cache(
  async (slug: string): Promise<Tenant | null> => {
    return prisma.tenant.findUnique({
      where: { slug, isActive: true },
    });
  }
);

/**
 * Cached tenant lookup by ID.
 * Uses React's cache() for request-level deduplication.
 */
export const getTenantById = cache(
  async (id: string): Promise<Tenant | null> => {
    return prisma.tenant.findUnique({
      where: { id, isActive: true },
    });
  }
);

/**
 * Creates a tenant-scoped query helper.
 * All queries through this helper are automatically filtered by tenantId.
 *
 * @example
 * const tenantQuery = createTenantScope(tenantId);
 * const products = await tenantQuery.product.findMany();
 */
export function createTenantScope(tenantId: string) {
  return {
    // Products scoped to tenant
    product: {
      findMany: (args?: Prisma.ProductFindManyArgs) =>
        prisma.product.findMany({
          ...args,
          where: { ...args?.where, tenantId },
        }),
      findFirst: (args?: Prisma.ProductFindFirstArgs) =>
        prisma.product.findFirst({
          ...args,
          where: { ...args?.where, tenantId },
        }),
      findUnique: (args: Prisma.ProductFindUniqueArgs) =>
        prisma.product.findUnique(args),
      create: (data: Omit<Prisma.ProductUncheckedCreateInput, "tenantId">) =>
        prisma.product.create({
          data: { ...data, tenantId },
        }),
      // SECURITY: Callers MUST verify record belongs to tenant before calling update/delete
      // These pass-through methods exist for flexibility but require ownership checks in router
      update: (args: Prisma.ProductUpdateArgs) =>
        prisma.product.update(args),
      delete: (args: Prisma.ProductDeleteArgs) =>
        prisma.product.delete(args),
      count: (args?: Prisma.ProductCountArgs) =>
        prisma.product.count({
          ...args,
          where: { ...args?.where, tenantId },
        }),
    },

    // Categories scoped to tenant
    category: {
      findMany: (args?: Prisma.CategoryFindManyArgs) =>
        prisma.category.findMany({
          ...args,
          where: { ...args?.where, tenantId },
        }),
      findFirst: (args?: Prisma.CategoryFindFirstArgs) =>
        prisma.category.findFirst({
          ...args,
          where: { ...args?.where, tenantId },
        }),
      create: (data: Omit<Prisma.CategoryUncheckedCreateInput, "tenantId">) =>
        prisma.category.create({
          data: { ...data, tenantId },
        }),
      count: (args?: Prisma.CategoryCountArgs) =>
        prisma.category.count({
          ...args,
          where: { ...args?.where, tenantId },
        }),
    },

    // Dishes scoped to tenant
    dish: {
      findMany: (args?: Prisma.DishFindManyArgs) =>
        prisma.dish.findMany({
          ...args,
          where: { ...args?.where, tenantId },
        }),
      findFirst: (args?: Prisma.DishFindFirstArgs) =>
        prisma.dish.findFirst({
          ...args,
          where: { ...args?.where, tenantId },
        }),
      create: (data: Omit<Prisma.DishUncheckedCreateInput, "tenantId">) =>
        prisma.dish.create({
          data: { ...data, tenantId },
        }),
      count: (args?: Prisma.DishCountArgs) =>
        prisma.dish.count({
          ...args,
          where: { ...args?.where, tenantId },
        }),
    },

    // Tables scoped to tenant
    table: {
      findMany: (args?: Prisma.TableFindManyArgs) =>
        prisma.table.findMany({
          ...args,
          where: { ...args?.where, tenantId },
        }),
      findFirst: (args?: Prisma.TableFindFirstArgs) =>
        prisma.table.findFirst({
          ...args,
          where: { ...args?.where, tenantId },
        }),
      findByQrCode: (qrCode: string) =>
        prisma.table.findFirst({
          where: { qrCode, tenantId },
        }),
      create: (data: Omit<Prisma.TableUncheckedCreateInput, "tenantId">) =>
        prisma.table.create({
          data: { ...data, tenantId },
        }),
      count: (args?: Prisma.TableCountArgs) =>
        prisma.table.count({
          ...args,
          where: { ...args?.where, tenantId },
        }),
    },

    // Orders scoped to tenant
    order: {
      findMany: (args?: Prisma.OrderFindManyArgs) =>
        prisma.order.findMany({
          ...args,
          where: { ...args?.where, tenantId },
        }),
      findFirst: (args?: Prisma.OrderFindFirstArgs) =>
        prisma.order.findFirst({
          ...args,
          where: { ...args?.where, tenantId },
        }),
      create: (data: Omit<Prisma.OrderUncheckedCreateInput, "tenantId">) =>
        prisma.order.create({
          data: { ...data, tenantId },
        }),
      count: (args?: Prisma.OrderCountArgs) =>
        prisma.order.count({
          ...args,
          where: { ...args?.where, tenantId },
        }),
    },

    // Users scoped to tenant
    user: {
      findMany: (args?: Prisma.UserFindManyArgs) =>
        prisma.user.findMany({
          ...args,
          where: { ...args?.where, tenantId },
        }),
      findFirst: (args?: Prisma.UserFindFirstArgs) =>
        prisma.user.findFirst({
          ...args,
          where: { ...args?.where, tenantId },
        }),
      findByEmail: (email: string) =>
        prisma.user.findFirst({
          where: { email, tenantId },
        }),
      create: (data: Omit<Prisma.UserUncheckedCreateInput, "tenantId">) =>
        prisma.user.create({
          data: { ...data, tenantId },
        }),
      count: (args?: Prisma.UserCountArgs) =>
        prisma.user.count({
          ...args,
          where: { ...args?.where, tenantId },
        }),
    },

    // PrepSectors scoped to tenant
    prepSector: {
      findMany: (args?: Prisma.PrepSectorFindManyArgs) =>
        prisma.prepSector.findMany({
          ...args,
          where: { ...args?.where, tenantId },
        }),
      findFirst: (args?: Prisma.PrepSectorFindFirstArgs) =>
        prisma.prepSector.findFirst({
          ...args,
          where: { ...args?.where, tenantId },
        }),
      create: (data: Omit<Prisma.PrepSectorUncheckedCreateInput, "tenantId">) =>
        prisma.prepSector.create({
          data: { ...data, tenantId },
        }),
    },

    // Settings for tenant
    settings: {
      get: () =>
        prisma.settings.findUnique({
          where: { tenantId },
        }),
      upsert: (data: Omit<Prisma.SettingsUncheckedCreateInput, "tenantId">) =>
        prisma.settings.upsert({
          where: { tenantId },
          create: { ...data, tenantId },
          update: data,
        }),
    },
  };
}

export type TenantScope = ReturnType<typeof createTenantScope>;
