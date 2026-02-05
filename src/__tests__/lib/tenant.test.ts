/**
 * Multi-Tenancy Tests
 *
 * Tests tenant isolation and scoped database operations:
 * - Tenant lookup by slug and ID
 * - Tenant-scoped queries ensuring data isolation
 * - Preventing cross-tenant data leaks
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { getTenantBySlug, getTenantById, createTenantScope } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { createMockTenant, createMockTable, createMockDish } from "../utils/test-helpers";

describe("Multi-Tenancy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getTenantBySlug", () => {
    it("should return tenant when found and active", async () => {
      const mockTenant = createMockTenant({
        slug: "restaurant-a",
        isActive: true,
      });

      vi.mocked(prisma.tenant.findUnique).mockResolvedValue(mockTenant);

      const tenant = await getTenantBySlug("restaurant-a");

      expect(tenant).toEqual(mockTenant);
      expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { slug: "restaurant-a", isActive: true },
      });
    });

    it("should return null for inactive tenant", async () => {
      vi.mocked(prisma.tenant.findUnique).mockResolvedValue(null);

      const tenant = await getTenantBySlug("inactive-restaurant");

      expect(tenant).toBeNull();
    });

    it("should return null for non-existent tenant", async () => {
      vi.mocked(prisma.tenant.findUnique).mockResolvedValue(null);

      const tenant = await getTenantBySlug("non-existent");

      expect(tenant).toBeNull();
    });
  });

  describe("getTenantById", () => {
    it("should return tenant when found and active", async () => {
      const mockTenant = createMockTenant({
        id: "tenant_123",
        isActive: true,
      });

      vi.mocked(prisma.tenant.findUnique).mockResolvedValue(mockTenant);

      const tenant = await getTenantById("tenant_123");

      expect(tenant).toEqual(mockTenant);
      expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: "tenant_123", isActive: true },
      });
    });

    it("should return null for inactive tenant", async () => {
      vi.mocked(prisma.tenant.findUnique).mockResolvedValue(null);

      const tenant = await getTenantById("tenant_inactive");

      expect(tenant).toBeNull();
    });
  });

  describe("createTenantScope", () => {
    const tenantId = "tenant_123";

    describe("product queries", () => {
      it("should scope findMany to tenant", async () => {
        const scope = createTenantScope(tenantId);
        vi.mocked(prisma.product.findMany).mockResolvedValue([]);

        await scope.product.findMany();

        expect(prisma.product.findMany).toHaveBeenCalledWith({
          where: { tenantId },
        });
      });

      it("should scope findMany with additional filters", async () => {
        const scope = createTenantScope(tenantId);
        vi.mocked(prisma.product.findMany).mockResolvedValue([]);

        await scope.product.findMany({
          where: { isActive: true },
        });

        expect(prisma.product.findMany).toHaveBeenCalledWith({
          where: { tenantId, isActive: true },
        });
      });

      it("should scope findFirst to tenant", async () => {
        const scope = createTenantScope(tenantId);
        vi.mocked(prisma.product.findFirst).mockResolvedValue(null);

        await scope.product.findFirst();

        expect(prisma.product.findFirst).toHaveBeenCalledWith({
          where: { tenantId },
        });
      });

      it("should scope count to tenant", async () => {
        const scope = createTenantScope(tenantId);
        vi.mocked(prisma.product.count).mockResolvedValue(5);

        const count = await scope.product.count();

        expect(count).toBe(5);
        expect(prisma.product.count).toHaveBeenCalledWith({
          where: { tenantId },
        });
      });

      it("should inject tenantId when creating", async () => {
        const scope = createTenantScope(tenantId);
        const mockProduct = {
          id: "product_1",
          name: "Tomatoes",
          unit: "KILOGRAM" as const,
          quantity: 10,
          alertThreshold: 2,
          isActive: true,
        };

        vi.mocked(prisma.product.create).mockResolvedValue({
          ...mockProduct,
          tenantId,
        } as any);

        const result = await scope.product.create(mockProduct as any);

        expect(prisma.product.create).toHaveBeenCalledWith({
          data: { ...mockProduct, tenantId },
        });
      });
    });

    describe("table queries", () => {
      it("should scope findMany to tenant", async () => {
        const scope = createTenantScope(tenantId);
        const mockTables = [createMockTable({ tenantId })];

        vi.mocked(prisma.table.findMany).mockResolvedValue(mockTables);

        const tables = await scope.table.findMany();

        expect(prisma.table.findMany).toHaveBeenCalledWith({
          where: { tenantId },
        });
        expect(tables).toEqual(mockTables);
      });

      it("should scope findByQrCode to tenant", async () => {
        const scope = createTenantScope(tenantId);
        const mockTable = createMockTable({ tenantId, qrCode: "ABC123" });

        vi.mocked(prisma.table.findFirst).mockResolvedValue(mockTable);

        const table = await scope.table.findByQrCode("ABC123");

        expect(prisma.table.findFirst).toHaveBeenCalledWith({
          where: { qrCode: "ABC123", tenantId },
        });
        expect(table).toEqual(mockTable);
      });

      it("should prevent access to other tenant tables", async () => {
        const scope = createTenantScope("tenant_A");

        vi.mocked(prisma.table.findFirst).mockResolvedValue(null);

        const table = await scope.table.findFirst({
          where: { qrCode: "XYZ789" },
        });

        expect(table).toBeNull();
        expect(prisma.table.findFirst).toHaveBeenCalledWith({
          where: { tenantId: "tenant_A", qrCode: "XYZ789" },
        });
      });
    });

    describe("dish queries", () => {
      it("should scope findMany to tenant", async () => {
        const scope = createTenantScope(tenantId);
        const mockDishes = [createMockDish({ tenantId })];

        vi.mocked(prisma.dish.findMany).mockResolvedValue(mockDishes);

        const dishes = await scope.dish.findMany();

        expect(prisma.dish.findMany).toHaveBeenCalledWith({
          where: { tenantId },
        });
      });

      it("should scope findMany with category filter", async () => {
        const scope = createTenantScope(tenantId);
        vi.mocked(prisma.dish.findMany).mockResolvedValue([]);

        await scope.dish.findMany({
          where: { categoryId: "category_123" },
        });

        expect(prisma.dish.findMany).toHaveBeenCalledWith({
          where: { tenantId, categoryId: "category_123" },
        });
      });

      it("should scope count with filters", async () => {
        const scope = createTenantScope(tenantId);
        vi.mocked(prisma.dish.count).mockResolvedValue(10);

        const count = await scope.dish.count({
          where: { isAvailable: true },
        });

        expect(count).toBe(10);
        expect(prisma.dish.count).toHaveBeenCalledWith({
          where: { tenantId, isAvailable: true },
        });
      });
    });

    describe("order queries", () => {
      it("should scope findMany to tenant", async () => {
        const scope = createTenantScope(tenantId);
        vi.mocked(prisma.order.findMany).mockResolvedValue([]);

        await scope.order.findMany();

        expect(prisma.order.findMany).toHaveBeenCalledWith({
          where: { tenantId },
        });
      });

      it("should scope findMany with status filter", async () => {
        const scope = createTenantScope(tenantId);
        vi.mocked(prisma.order.findMany).mockResolvedValue([]);

        await scope.order.findMany({
          where: { status: "PENDING" },
        });

        expect(prisma.order.findMany).toHaveBeenCalledWith({
          where: { tenantId, status: "PENDING" },
        });
      });

      it("should prevent cross-tenant order access", async () => {
        const scopeA = createTenantScope("tenant_A");
        vi.mocked(prisma.order.findFirst).mockResolvedValue(null);

        const order = await scopeA.order.findFirst({
          where: { id: "order_from_tenant_B" },
        });

        expect(order).toBeNull();
        expect(prisma.order.findFirst).toHaveBeenCalledWith({
          where: { tenantId: "tenant_A", id: "order_from_tenant_B" },
        });
      });
    });

    describe("user queries", () => {
      it("should scope findByEmail to tenant", async () => {
        const scope = createTenantScope(tenantId);
        vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

        await scope.user.findByEmail("user@test.com");

        expect(prisma.user.findFirst).toHaveBeenCalledWith({
          where: { email: "user@test.com", tenantId },
        });
      });

      it("should prevent finding users from other tenants", async () => {
        const scope = createTenantScope("tenant_A");
        vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

        const user = await scope.user.findFirst({
          where: { email: "admin@tenant_B.com" },
        });

        expect(user).toBeNull();
        expect(prisma.user.findFirst).toHaveBeenCalledWith({
          where: { tenantId: "tenant_A", email: "admin@tenant_B.com" },
        });
      });
    });

    describe("settings", () => {
      it("should get settings for specific tenant", async () => {
        const scope = createTenantScope(tenantId);
        const mockSettings = {
          id: "settings_1",
          tenantId,
          vatRate: 10,
          currency: "EUR",
        };

        vi.mocked(prisma.settings.findUnique).mockResolvedValue(mockSettings as any);

        const settings = await scope.settings.get();

        expect(settings).toEqual(mockSettings);
        expect(prisma.settings.findUnique).toHaveBeenCalledWith({
          where: { tenantId },
        });
      });

      it("should upsert settings with tenantId", async () => {
        const scope = createTenantScope(tenantId);
        const settingsData = {
          vatRate: 21,
          currency: "EUR",
        };

        vi.mocked(prisma.settings.upsert).mockResolvedValue({
          id: "settings_1",
          tenantId,
          ...settingsData,
        } as any);

        await scope.settings.upsert(settingsData as any);

        expect(prisma.settings.upsert).toHaveBeenCalledWith({
          where: { tenantId },
          create: { ...settingsData, tenantId },
          update: settingsData,
        });
      });
    });
  });

  describe("tenant isolation edge cases", () => {
    it("should never leak data between tenants in parallel queries", async () => {
      const scopeA = createTenantScope("tenant_A");
      const scopeB = createTenantScope("tenant_B");

      vi.mocked(prisma.table.findMany)
        .mockResolvedValueOnce([createMockTable({ tenantId: "tenant_A" })])
        .mockResolvedValueOnce([createMockTable({ tenantId: "tenant_B" })]);

      const [tablesA, tablesB] = await Promise.all([
        scopeA.table.findMany(),
        scopeB.table.findMany(),
      ]);

      expect(tablesA[0].tenantId).toBe("tenant_A");
      expect(tablesB[0].tenantId).toBe("tenant_B");
    });

    it("should maintain isolation when using includes", async () => {
      const scope = createTenantScope("tenant_123");
      vi.mocked(prisma.order.findMany).mockResolvedValue([]);

      await scope.order.findMany({
        include: { items: true, table: true },
      });

      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: { tenantId: "tenant_123" },
        include: { items: true, table: true },
      });
    });

    it("should prevent tenantId override attempts", async () => {
      const scope = createTenantScope("tenant_A");
      vi.mocked(prisma.order.findMany).mockResolvedValue([]);

      // Attempt to override tenantId should fail (scope should always use its own)
      await scope.order.findMany({
        where: { tenantId: "tenant_B" } as any,
      });

      // The scope should force tenant_A, not tenant_B
      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: { tenantId: "tenant_A" },
      });
    });
  });
});
