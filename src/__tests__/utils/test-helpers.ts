/**
 * Test Utilities and Helpers
 *
 * Common utilities for testing across the application.
 */

import { vi } from "vitest";
import type { Role, Tenant, User, Table, Dish, Order, Category, PrepSector } from "@prisma/client";

/**
 * Simple Decimal mock for testing
 * Mimics Prisma's Decimal type without requiring runtime library
 */
class Decimal {
  private value: string;

  constructor(value: string | number) {
    this.value = String(value);
  }

  toString(): string {
    return this.value;
  }

  toNumber(): number {
    return parseFloat(this.value);
  }

  static isDecimal(value: unknown): value is Decimal {
    return value instanceof Decimal;
  }
}

export { Decimal };

/**
 * Mock data factories for creating test data
 */

export function createMockTenant(overrides?: Partial<Tenant>): Tenant {
  return {
    id: "tenant_123",
    name: "Test Restaurant",
    slug: "test-restaurant",
    email: "test@restaurant.com",
    phone: "+34123456789",
    address: "123 Test St",
    logoUrl: null,
    isActive: true,
    plan: "PROFESSIONAL",
    trialEndsAt: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: "user_123",
    tenantId: "tenant_123",
    email: "admin@test.com",
    passwordHash: "$2a$10$test.hash.here",
    name: "Test Admin",
    role: "ADMIN" as Role,
    isActive: true,
    emailVerified: new Date("2024-01-01"),
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

export function createMockTable(overrides?: Partial<Table>): Table {
  return {
    id: "table_123",
    tenantId: "tenant_123",
    number: 1,
    name: "Table 1",
    qrCode: "ABC123",
    capacity: 4,
    status: "AVAILABLE",
    zone: "Main Hall",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

export function createMockCategory(overrides?: Partial<Category>): Category {
  return {
    id: "category_123",
    tenantId: "tenant_123",
    name: "Appetizers",
    nameEn: "Appetizers",
    description: "Start your meal",
    displayOrder: 0,
    prepSectorId: "sector_123",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

export function createMockPrepSector(overrides?: Partial<PrepSector>): PrepSector {
  return {
    id: "sector_123",
    tenantId: "tenant_123",
    name: "Kitchen",
    code: "KITCHEN",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

export function createMockDish(overrides?: Partial<Dish>): Dish {
  return {
    id: "dish_123",
    tenantId: "tenant_123",
    categoryId: "category_123",
    name: "Patatas Bravas",
    nameEn: "Spicy Potatoes",
    description: "Crispy potatoes with spicy sauce",
    descriptionEn: "Crispy potatoes with spicy sauce",
    price: new Decimal("8.50"),
    imageUrl: null,
    isAvailable: true,
    isInStock: true,
    allergens: ["gluten"],
    displayOrder: 0,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

export function createMockOrder(overrides?: Partial<Order>): Order {
  return {
    id: "order_123",
    tenantId: "tenant_123",
    tableId: "table_123",
    orderNumber: 1,
    status: "PENDING",
    customerNotes: null,
    subtotal: new Decimal("25.00"),
    vatAmount: new Decimal("2.50"),
    tipAmount: new Decimal("0.00"),
    total: new Decimal("27.50"),
    createdById: null,
    closedById: null,
    closedAt: null,
    createdAt: new Date("2024-01-01T12:00:00Z"),
    updatedAt: new Date("2024-01-01T12:00:00Z"),
    ...overrides,
  };
}

/**
 * Mock session helper
 */
export function createMockSession(role: Role = "ADMIN") {
  return {
    user: {
      id: "user_123",
      email: "admin@test.com",
      name: "Test Admin",
      tenantId: "tenant_123",
      tenantSlug: "test-restaurant",
      role,
    },
  };
}

/**
 * Mock context for tRPC procedures
 */
export function createMockContext(role: Role = "ADMIN") {
  return {
    session: createMockSession(role),
  };
}

/**
 * Wait for async operations to complete
 */
export const waitFor = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Create a mock tRPC caller for testing
 */
export function createMockCaller(ctx: any) {
  return {
    ctx,
  };
}

/**
 * Decimal helper for tests
 */
export function decimal(value: number): Decimal {
  return new Decimal(value);
}

/**
 * Mock sessionStorage for cart tests
 */
export function mockSessionStorage() {
  const storage: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => storage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete storage[key];
    }),
    clear: vi.fn(() => {
      Object.keys(storage).forEach((key) => delete storage[key]);
    }),
  };
}
