import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { locales, defaultLocale } from "@/i18n/config";

/**
 * Middleware for BaresyResto
 *
 * Handles:
 * 1. Internationalization (locale routing)
 * 2. Tenant resolution from URL slugs
 * 3. Authentication checks (delegated to NextAuth)
 *
 * Route patterns:
 * - /[locale]/menu/[tenantSlug]/[tableCode] - Public menu (no auth)
 * - /[locale]/login - Authentication pages
 * - /[locale]/[tenantSlug]/... - Dashboard routes (require auth)
 */

// Create the next-intl middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

/**
 * Public routes that don't require authentication
 * Menu routes are public so customers can scan QR codes
 */
const publicPatterns = [
  /^\/[a-z]{2}\/menu\/[^/]+\/[^/]+$/, // /[locale]/menu/[tenantSlug]/[tableCode]
  /^\/[a-z]{2}\/menu\/[^/]+$/, // /[locale]/menu/[tenantSlug]
  /^\/[a-z]{2}\/login$/, // /[locale]/login
  /^\/[a-z]{2}\/register$/, // /[locale]/register
  /^\/api\//, // API routes handled separately
];

function isPublicRoute(pathname: string): boolean {
  return publicPatterns.some((pattern) => pattern.test(pathname));
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and internal paths
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".") // static files
  ) {
    return NextResponse.next();
  }

  // Apply internationalization middleware
  const response = intlMiddleware(request);

  // Extract tenant slug from dashboard routes for context
  // Pattern: /[locale]/[tenantSlug]/...
  const tenantMatch = pathname.match(/^\/[a-z]{2}\/([^/]+)(?:\/|$)/);
  if (tenantMatch && !isPublicRoute(pathname)) {
    const tenantSlug = tenantMatch[1];

    // Skip if this is a known non-tenant route
    const nonTenantRoutes = ["login", "register", "menu", "api"];
    if (!nonTenantRoutes.includes(tenantSlug)) {
      // Add tenant slug to headers for downstream use
      response.headers.set("x-tenant-slug", tenantSlug);
    }
  }

  return response;
}

export const config = {
  // Match all paths except static files and API routes
  matcher: [
    // Enable middleware for all paths
    "/((?!_next|api/auth|.*\\..*).*)",
  ],
};
