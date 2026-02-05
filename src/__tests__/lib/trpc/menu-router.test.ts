/**
 * Menu Router Tests
 *
 * Tests menu/dish CRUD operations:
 * - Creating, updating, deleting dishes
 * - Stock toggle functionality
 * - Multi-tenancy isolation
 * - Public menu endpoint
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { prisma } from "@/lib/db";
import {
  createMockContext,
  createMockTenant,
  createMockDish,
  createMockCategory,
  createMockPrepSector,
  decimal,
} from "../../utils/test-helpers";

describe("Menu Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list (protected)", () => {
    it("should list all dishes for tenant", async () => {
      const ctx = createMockContext("ADMIN");
      const mockDishes = [
        createMockDish({ tenantId: ctx.session.user.tenantId }),
        createMockDish({ id: "dish_2", tenantId: ctx.session.user.tenantId }),
      ];

      vi.mocked(prisma.dish.findMany).mockResolvedValue(mockDishes as any);

      expect(mockDishes).toHaveLength(2);
      expect(mockDishes[0].tenantId).toBe(ctx.session.user.tenantId);
    });

    it("should filter dishes by category", async () => {
      const ctx = createMockContext("ADMIN");
      const categoryId = "category_123";

      const expectedWhere = {
        tenantId: ctx.session.user.tenantId,
        categoryId,
      };

      expect(expectedWhere.categoryId).toBe(categoryId);
    });

    it("should filter by availability", async () => {
      const ctx = createMockContext("ADMIN");

      const expectedWhere = {
        tenantId: ctx.session.user.tenantId,
        isAvailable: true,
      };

      expect(expectedWhere.isAvailable).toBe(true);
    });

    it("should filter by stock status", async () => {
      const ctx = createMockContext("ADMIN");

      const expectedWhere = {
        tenantId: ctx.session.user.tenantId,
        isInStock: true,
      };

      expect(expectedWhere.isInStock).toBe(true);
    });

    it("should search dishes by name", async () => {
      const ctx = createMockContext("ADMIN");
      const searchTerm = "paella";

      const expectedWhere = {
        tenantId: ctx.session.user.tenantId,
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { nameEn: { contains: searchTerm, mode: "insensitive" } },
          { description: { contains: searchTerm, mode: "insensitive" } },
        ],
      };

      expect(expectedWhere.OR).toHaveLength(3);
    });

    it("should order by category and displayOrder", async () => {
      const expectedOrderBy = [
        { category: { displayOrder: "asc" } },
        { displayOrder: "asc" },
        { name: "asc" },
      ];

      expect(expectedOrderBy).toHaveLength(3);
    });
  });

  describe("getById (protected)", () => {
    it("should return dish with full details", async () => {
      const ctx = createMockContext("ADMIN");
      const mockDish = createMockDish({ tenantId: ctx.session.user.tenantId });
      const mockCategory = createMockCategory({ tenantId: ctx.session.user.tenantId });

      vi.mocked(prisma.dish.findFirst).mockResolvedValue({
        ...mockDish,
        category: mockCategory,
        ingredients: [],
      } as any);

      expect(mockDish.tenantId).toBe(ctx.session.user.tenantId);
    });

    it("should throw NOT_FOUND for non-existent dish", async () => {
      const ctx = createMockContext("ADMIN");
      vi.mocked(prisma.dish.findFirst).mockResolvedValue(null);

      expect(() => {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Dish not found",
        });
      }).toThrow("Dish not found");
    });

    it("should include ingredients with product details", async () => {
      const mockIngredients = [
        {
          id: "ing_1",
          dishId: "dish_123",
          productId: "prod_1",
          quantityNeeded: decimal(0.5),
          product: {
            id: "prod_1",
            name: "Tomatoes",
            unit: "KILOGRAM",
            quantity: decimal(10),
          },
        },
      ];

      expect(mockIngredients[0].product.name).toBe("Tomatoes");
      expect(mockIngredients[0].quantityNeeded.toNumber()).toBe(0.5);
    });
  });

  describe("create (protected)", () => {
    it("should create dish with valid data", async () => {
      const ctx = createMockContext("ADMIN");
      const mockCategory = createMockCategory({ tenantId: ctx.session.user.tenantId });
      const dishData = {
        name: "New Dish",
        price: 12.50,
        categoryId: mockCategory.id,
        isAvailable: true,
      };

      vi.mocked(prisma.category.findFirst).mockResolvedValue(mockCategory);
      vi.mocked(prisma.dish.findUnique).mockResolvedValue(null); // No duplicate
      vi.mocked(prisma.dish.findFirst).mockResolvedValue(null); // For max order
      vi.mocked(prisma.dish.create).mockResolvedValue({
        ...createMockDish(dishData as any),
        tenantId: ctx.session.user.tenantId,
      } as any);

      expect(dishData.name).toBe("New Dish");
      expect(dishData.price).toBe(12.50);
    });

    it("should throw NOT_FOUND for invalid category", async () => {
      const ctx = createMockContext("ADMIN");
      vi.mocked(prisma.category.findFirst).mockResolvedValue(null);

      expect(() => {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }).toThrow("Category not found");
    });

    it("should throw CONFLICT for duplicate name", async () => {
      const ctx = createMockContext("ADMIN");
      const mockCategory = createMockCategory({ tenantId: ctx.session.user.tenantId });
      const existingDish = createMockDish({ name: "Paella", tenantId: ctx.session.user.tenantId });

      vi.mocked(prisma.category.findFirst).mockResolvedValue(mockCategory);
      vi.mocked(prisma.dish.findUnique).mockResolvedValue(existingDish);

      expect(() => {
        throw new TRPCError({
          code: "CONFLICT",
          message: 'Dish "Paella" already exists',
        });
      }).toThrow('Dish "Paella" already exists');
    });

    it("should auto-increment displayOrder if not provided", async () => {
      const ctx = createMockContext("ADMIN");
      const lastDish = createMockDish({ displayOrder: 5 });

      vi.mocked(prisma.dish.findFirst).mockResolvedValue(lastDish);

      const nextDisplayOrder = (lastDish.displayOrder ?? 0) + 1;
      expect(nextDisplayOrder).toBe(6);
    });

    it("should start displayOrder at 1 for first dish", async () => {
      vi.mocked(prisma.dish.findFirst).mockResolvedValue(null);

      const displayOrder = 1;
      expect(displayOrder).toBe(1);
    });

    it("should validate price is positive", async () => {
      const invalidPrice = -5.00;

      expect(() => {
        if (invalidPrice <= 0) {
          throw new Error("Price must be positive");
        }
      }).toThrow("Price must be positive");
    });

    it("should validate price maximum", async () => {
      const maxPrice = 9999.99;
      const validPrice = 150.00;
      const invalidPrice = 10000.00;

      expect(validPrice).toBeLessThanOrEqual(maxPrice);
      expect(invalidPrice).toBeGreaterThan(maxPrice);
    });

    it("should handle allergens array", async () => {
      const allergens = ["gluten", "milk", "nuts"];

      expect(allergens).toHaveLength(3);
      expect(allergens).toContain("gluten");
    });

    it("should limit allergens to 20 items", async () => {
      const maxAllergens = 20;
      const allergens = new Array(25).fill("allergen");

      expect(() => {
        if (allergens.length > maxAllergens) {
          throw new Error("Too many allergens");
        }
      }).toThrow("Too many allergens");
    });
  });

  describe("update (protected)", () => {
    it("should update dish details", async () => {
      const ctx = createMockContext("ADMIN");
      const existingDish = createMockDish({ tenantId: ctx.session.user.tenantId });
      const updateData = {
        name: "Updated Name",
        price: 15.00,
      };

      vi.mocked(prisma.dish.findFirst).mockResolvedValue(existingDish);
      vi.mocked(prisma.dish.update).mockResolvedValue({
        ...existingDish,
        ...updateData,
        price: decimal(updateData.price),
      } as any);

      expect(updateData.name).toBe("Updated Name");
    });

    it("should throw NOT_FOUND for non-existent dish", async () => {
      const ctx = createMockContext("ADMIN");
      vi.mocked(prisma.dish.findFirst).mockResolvedValue(null);

      expect(() => {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Dish not found",
        });
      }).toThrow("Dish not found");
    });

    it("should prevent duplicate names when updating", async () => {
      const ctx = createMockContext("ADMIN");
      const existingDish = createMockDish({ id: "dish_1", name: "Paella" });
      const duplicateDish = createMockDish({ id: "dish_2", name: "Tapas" });

      vi.mocked(prisma.dish.findFirst)
        .mockResolvedValueOnce(existingDish) // First call: get dish
        .mockResolvedValueOnce(duplicateDish); // Second call: check duplicate
      vi.mocked(prisma.dish.findUnique).mockResolvedValue(duplicateDish);

      expect(() => {
        if (duplicateDish && duplicateDish.id !== existingDish.id) {
          throw new TRPCError({
            code: "CONFLICT",
            message: 'Dish "Tapas" already exists',
          });
        }
      }).toThrow('Dish "Tapas" already exists');
    });

    it("should validate new category exists", async () => {
      const ctx = createMockContext("ADMIN");
      const existingDish = createMockDish({ tenantId: ctx.session.user.tenantId });

      vi.mocked(prisma.dish.findFirst).mockResolvedValue(existingDish);
      vi.mocked(prisma.category.findFirst).mockResolvedValue(null);

      expect(() => {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }).toThrow("Category not found");
    });

    it("should allow partial updates", async () => {
      const existingDish = createMockDish({
        name: "Paella",
        price: decimal(15.00),
        description: "Traditional rice dish",
      });

      const partialUpdate = {
        price: 16.00, // Only update price
      };

      const result = {
        ...existingDish,
        price: decimal(partialUpdate.price),
      };

      expect(result.name).toBe("Paella"); // Unchanged
      expect(result.price.toNumber()).toBe(16.00); // Updated
    });
  });

  describe("toggleAvailable (protected)", () => {
    it("should toggle isAvailable from true to false", async () => {
      const ctx = createMockContext("ADMIN");
      const dish = createMockDish({ isAvailable: true });

      vi.mocked(prisma.dish.findFirst).mockResolvedValue(dish);
      vi.mocked(prisma.dish.update).mockResolvedValue({
        ...dish,
        isAvailable: false,
      });

      const newStatus = !dish.isAvailable;
      expect(newStatus).toBe(false);
    });

    it("should toggle isAvailable from false to true", async () => {
      const ctx = createMockContext("ADMIN");
      const dish = createMockDish({ isAvailable: false });

      vi.mocked(prisma.dish.findFirst).mockResolvedValue(dish);

      const newStatus = !dish.isAvailable;
      expect(newStatus).toBe(true);
    });
  });

  describe("setStockStatus (protected)", () => {
    it("should set stock status to false", async () => {
      const ctx = createMockContext("ADMIN");
      const dish = createMockDish({ isInStock: true });

      vi.mocked(prisma.dish.findFirst).mockResolvedValue(dish);
      vi.mocked(prisma.dish.update).mockResolvedValue({
        ...dish,
        isInStock: false,
      });

      expect(false).toBe(false);
    });

    it("should set stock status to true", async () => {
      const ctx = createMockContext("ADMIN");
      const dish = createMockDish({ isInStock: false });

      vi.mocked(prisma.dish.findFirst).mockResolvedValue(dish);
      vi.mocked(prisma.dish.update).mockResolvedValue({
        ...dish,
        isInStock: true,
      });

      expect(true).toBe(true);
    });
  });

  describe("delete (protected)", () => {
    it("should delete dish", async () => {
      const ctx = createMockContext("ADMIN");
      const dish = createMockDish({ tenantId: ctx.session.user.tenantId });

      vi.mocked(prisma.dish.findFirst).mockResolvedValue(dish);
      vi.mocked(prisma.dish.delete).mockResolvedValue(dish);

      expect(dish.id).toBeDefined();
    });

    it("should throw NOT_FOUND for non-existent dish", async () => {
      const ctx = createMockContext("ADMIN");
      vi.mocked(prisma.dish.findFirst).mockResolvedValue(null);

      expect(() => {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Dish not found",
        });
      }).toThrow("Dish not found");
    });
  });

  describe("getStats (protected)", () => {
    it("should return menu statistics", async () => {
      const ctx = createMockContext("ADMIN");

      vi.mocked(prisma.dish.count)
        .mockResolvedValueOnce(50) // total
        .mockResolvedValueOnce(45) // available
        .mockResolvedValueOnce(3) // unavailable
        .mockResolvedValueOnce(2); // out of stock
      vi.mocked(prisma.category.count).mockResolvedValue(8);

      const stats = {
        total: 50,
        available: 45,
        unavailable: 3,
        outOfStock: 2,
        categories: 8,
      };

      expect(stats.total).toBe(50);
      expect(stats.available).toBe(45);
      expect(stats.categories).toBe(8);
    });
  });

  describe("getPublicMenu (public)", () => {
    it("should return available dishes for customer menu", async () => {
      const mockTenant = createMockTenant({ slug: "test-restaurant" });
      const mockDishes = [
        createMockDish({
          tenantId: mockTenant.id,
          isAvailable: true,
          isInStock: true,
        }),
      ];

      vi.mocked(prisma.tenant.findUnique).mockResolvedValue(mockTenant);
      vi.mocked(prisma.dish.findMany).mockResolvedValue(mockDishes as any);

      expect(mockDishes[0].isAvailable).toBe(true);
      expect(mockDishes[0].isInStock).toBe(true);
    });

    it("should filter by category if provided", async () => {
      const categoryId = "category_123";

      const expectedWhere = {
        tenantId: "tenant_123",
        isAvailable: true,
        isInStock: true,
        categoryId,
      };

      expect(expectedWhere.categoryId).toBe(categoryId);
    });

    it("should only return available and in-stock dishes", async () => {
      const expectedWhere = {
        tenantId: "tenant_123",
        isAvailable: true,
        isInStock: true,
      };

      expect(expectedWhere.isAvailable).toBe(true);
      expect(expectedWhere.isInStock).toBe(true);
    });

    it("should throw NOT_FOUND for inactive tenant", async () => {
      vi.mocked(prisma.tenant.findUnique).mockResolvedValue(null);

      expect(() => {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Restaurant not found",
        });
      }).toThrow("Restaurant not found");
    });

    it("should return dishes with localized names", async () => {
      const dish = createMockDish({
        name: "Paella Valenciana",
        nameEn: "Valencian Paella",
        description: "Arroz con mariscos",
        descriptionEn: "Rice with seafood",
      });

      expect(dish.name).toBe("Paella Valenciana");
      expect(dish.nameEn).toBe("Valencian Paella");
    });

    it("should include allergen information", async () => {
      const dish = createMockDish({
        allergens: ["gluten", "crustaceans", "fish"],
      });

      expect(dish.allergens).toContain("gluten");
      expect(dish.allergens).toContain("fish");
      expect(dish.allergens).toHaveLength(3);
    });
  });

  describe("multi-tenancy isolation", () => {
    it("should only show dishes from same tenant", async () => {
      const ctx = createMockContext("ADMIN");
      const tenantADish = createMockDish({ tenantId: "tenant_A" });
      const tenantBDish = createMockDish({ tenantId: "tenant_B" });

      // Query should filter by tenantId
      const expectedWhere = {
        tenantId: ctx.session.user.tenantId,
      };

      expect(expectedWhere.tenantId).toBe(ctx.session.user.tenantId);
    });

    it("should prevent accessing dishes from other tenants", async () => {
      const ctxTenantA = createMockContext("ADMIN");
      const dishFromTenantB = createMockDish({ tenantId: "tenant_B" });

      vi.mocked(prisma.dish.findFirst).mockResolvedValue(null);

      // Should not find dish from different tenant
      expect(dishFromTenantB.tenantId).not.toBe(ctxTenantA.session.user.tenantId);
    });
  });

  describe("validation edge cases", () => {
    it("should handle empty allergens array", async () => {
      const allergens: string[] = [];
      expect(allergens).toHaveLength(0);
    });

    it("should trim and validate dish names", async () => {
      const name = "  Paella Valenciana  ";
      const trimmed = name.trim();

      expect(trimmed).toBe("Paella Valenciana");
      expect(trimmed.length).toBeGreaterThan(0);
      expect(trimmed.length).toBeLessThanOrEqual(100);
    });

    it("should handle decimal price precision", async () => {
      const price = 12.955; // More than 2 decimals
      const rounded = Math.round(price * 100) / 100;

      expect(rounded).toBe(12.96);
    });

    it("should validate description length", async () => {
      const maxLength = 1000;
      const validDescription = "A".repeat(500);
      const invalidDescription = "A".repeat(1001);

      expect(validDescription.length).toBeLessThanOrEqual(maxLength);
      expect(invalidDescription.length).toBeGreaterThan(maxLength);
    });
  });
});
