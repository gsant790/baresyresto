import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { auth } from "@/lib/auth";
import type { Role } from "@prisma/client";
import { hasPermission, type Resource, type Action } from "@/lib/auth";

/**
 * tRPC Server Initialization
 *
 * Sets up the tRPC context and procedures for server-side API routes.
 * Integrates with NextAuth for authentication and multi-tenant authorization.
 */

/**
 * Context available to all tRPC procedures.
 * Contains authentication state and tenant context from the session.
 */
export interface Context {
  session: {
    user: {
      id: string;
      email: string;
      name: string;
      tenantId: string;
      tenantSlug: string;
      role: Role;
    };
  } | null;
}

/**
 * Create the tRPC context from the request.
 * Called for each request to create a fresh context.
 */
export async function createContext(): Promise<Context> {
  const session = await auth();
  return {
    session: session?.user
      ? {
          user: {
            id: session.user.id,
            email: session.user.email ?? "",
            name: session.user.name ?? "",
            tenantId: session.user.tenantId,
            tenantSlug: session.user.tenantSlug,
            role: session.user.role,
          },
        }
      : null,
  };
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

/**
 * Public procedure - no authentication required.
 * Use for public endpoints like menu viewing.
 */
export const publicProcedure = t.procedure;

/**
 * Router factory for grouping procedures.
 */
export const router = t.router;

/**
 * Merge routers together.
 */
export const mergeRouters = t.mergeRouters;

/**
 * Middleware to enforce authentication.
 * Throws UNAUTHORIZED if no valid session exists.
 */
const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to perform this action",
    });
  }

  return next({
    ctx: {
      session: ctx.session,
    },
  });
});

/**
 * Protected procedure - requires authentication.
 * The session is guaranteed to exist in the context.
 */
export const protectedProcedure = t.procedure.use(enforceAuth);

/**
 * Middleware factory to enforce specific permissions.
 * Checks the user's role against the permission matrix.
 *
 * @param resource - The resource being accessed (e.g., 'tables', 'orders')
 * @param action - The action being performed (e.g., 'view', 'create')
 */
export function requirePermission(resource: Resource, action: Action) {
  return t.middleware(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to perform this action",
      });
    }

    if (!hasPermission(ctx.session.user.role, resource, action)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `You do not have permission to ${action} ${resource}`,
      });
    }

    return next({
      ctx: {
        session: ctx.session,
      },
    });
  });
}
