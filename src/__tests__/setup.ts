/**
 * Test Setup File
 *
 * Runs before all tests. Sets up testing environment, mocks, and utilities.
 */

import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Cleanup after each test case
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock environment variables
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock NextAuth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  hasPermission: vi.fn(() => true),
  requireAuth: vi.fn(),
  requirePermission: vi.fn(),
  permissions: {
    SUPER_ADMIN: {
      inventory: ["view", "create", "update", "delete"],
      menu: ["view", "create", "update", "delete"],
      orders: ["view", "create", "update", "delete"],
      prep: ["view", "update"],
      tables: ["view", "create", "update", "delete"],
      users: ["view", "create", "update", "delete"],
      payments: ["view", "process", "refund"],
      settings: ["view", "update"],
    },
    ADMIN: {
      inventory: ["view", "create", "update", "delete"],
      menu: ["view", "create", "update", "delete"],
      orders: ["view", "create", "update", "delete"],
      prep: ["view", "update"],
      tables: ["view", "create", "update", "delete"],
      users: ["view", "create", "update", "delete"],
      payments: ["view", "process", "refund"],
      settings: ["view", "update"],
    },
    WAITER: {
      inventory: [],
      menu: ["view"],
      orders: ["view", "create", "update"],
      prep: [],
      tables: ["view", "update"],
      users: [],
      payments: ["view", "process"],
      settings: [],
    },
    COOK: {
      inventory: ["view"],
      menu: ["view"],
      orders: ["view"],
      prep: ["view", "update"],
      tables: [],
      users: [],
      payments: [],
      settings: [],
    },
    BARTENDER: {
      inventory: ["view"],
      menu: ["view"],
      orders: ["view"],
      prep: ["view", "update"],
      tables: [],
      users: [],
      payments: [],
      settings: [],
    },
  },
}));

// Mock Prisma client
vi.mock("@/lib/db", () => ({
  prisma: {
    tenant: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    product: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    table: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    dish: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    order: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    orderItem: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    orderStatusHistory: {
      create: vi.fn(),
    },
    category: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    prepSector: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    settings: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback({
      order: {
        create: vi.fn(),
        update: vi.fn(),
      },
      orderItem: {
        createMany: vi.fn(),
        findMany: vi.fn(),
        updateMany: vi.fn(),
      },
      orderStatusHistory: {
        create: vi.fn(),
      },
      table: {
        update: vi.fn(),
      },
    })),
  },
}));

// Extend Vitest matchers
declare module "vitest" {
  interface Assertion<T = any> {
    toBeInTheDocument(): T;
    toHaveTextContent(text: string): T;
    toBeVisible(): T;
    toBeDisabled(): T;
    toHaveClass(className: string): T;
  }
}
