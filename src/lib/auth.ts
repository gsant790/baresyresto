import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { Role } from "@prisma/client";

/**
 * Authentication Configuration
 *
 * Multi-tenant aware authentication using NextAuth v5.
 * Users authenticate within a tenant context, and their tenant/role
 * information is embedded in the JWT for authorization.
 */

// Validation schema for credentials
const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  tenantSlug: z.string().min(1),
});

// Extended types for NextAuth
declare module "next-auth" {
  interface User {
    tenantId: string;
    tenantSlug: string;
    role: Role;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      tenantId: string;
      tenantSlug: string;
      role: Role;
    };
  }
}

// Extend JWT type
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    tenantId: string;
    tenantSlug: string;
    role: Role;
  }
}

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        tenantSlug: { label: "Restaurant", type: "text" },
      },
      async authorize(credentials) {
        // Validate input
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password, tenantSlug } = parsed.data;

        // Find tenant by slug
        const tenant = await prisma.tenant.findUnique({
          where: { slug: tenantSlug, isActive: true },
        });

        if (!tenant) {
          return null;
        }

        // Find user within tenant
        const user = await prisma.user.findFirst({
          where: {
            email,
            tenantId: tenant.id,
            isActive: true,
          },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        // Verify password
        const isPasswordValid = await compare(password, user.passwordHash);
        if (!isPasswordValid) {
          return null;
        }

        // Return user with tenant context
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    /**
     * JWT callback - adds tenant and role info to token
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.tenantId = user.tenantId as string;
        token.tenantSlug = user.tenantSlug as string;
        token.role = user.role as Role;
      }
      return token;
    },

    /**
     * Session callback - exposes tenant and role info to client
     */
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.tenantId = token.tenantId as string;
      session.user.tenantSlug = token.tenantSlug as string;
      session.user.role = token.role as Role;
      return session;
    },

    /**
     * Authorized callback - protects routes
     */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.includes("/(dashboard)");
      const isOnAuth = nextUrl.pathname.includes("/(auth)");

      if (isOnDashboard) {
        // Dashboard routes require authentication
        if (isLoggedIn) return true;
        return false; // Redirect to login
      }

      if (isOnAuth) {
        // Auth routes: redirect to dashboard if already logged in
        if (isLoggedIn && auth.user.tenantSlug) {
          return Response.redirect(
            new URL(`/${auth.user.tenantSlug}`, nextUrl)
          );
        }
        return true;
      }

      // Public routes are always accessible
      return true;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === "development",
};

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth(authConfig);

/**
 * Permission Matrix
 *
 * Defines what each role can access. Used for authorization checks.
 */
export const permissions = {
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
    inventory: [] as string[],
    menu: ["view"],
    orders: ["view", "create", "update"],
    prep: [] as string[],
    tables: ["view", "update"],
    users: [] as string[],
    payments: ["view", "process"],
    settings: [] as string[],
  },
  COOK: {
    inventory: ["view"],
    menu: ["view"],
    orders: ["view"],
    prep: ["view", "update"],
    tables: [] as string[],
    users: [] as string[],
    payments: [] as string[],
    settings: [] as string[],
  },
  BARTENDER: {
    inventory: ["view"],
    menu: ["view"],
    orders: ["view"],
    prep: ["view", "update"],
    tables: [] as string[],
    users: [] as string[],
    payments: [] as string[],
    settings: [] as string[],
  },
} as const;

export type Resource = keyof (typeof permissions)["ADMIN"];
export type Action = "view" | "create" | "update" | "delete" | "process" | "refund";

/**
 * Check if a role has permission to perform an action on a resource
 */
export function hasPermission(
  role: Role,
  resource: Resource,
  action: Action
): boolean {
  const rolePermissions = permissions[role as keyof typeof permissions];
  if (!rolePermissions) return false;

  const resourcePermissions = rolePermissions[resource] as readonly string[];
  return resourcePermissions.includes(action);
}

/**
 * Get the current authenticated session (server-side)
 * Throws if not authenticated
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

/**
 * Check if current user has permission (server-side)
 */
export async function requirePermission(resource: Resource, action: Action) {
  const session = await requireAuth();
  if (!hasPermission(session.user.role, resource, action)) {
    throw new Error("Forbidden");
  }
  return session;
}
