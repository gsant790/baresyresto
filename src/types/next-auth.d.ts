/**
 * NextAuth Type Declarations
 *
 * Extends NextAuth's default types to include our custom fields
 * for multi-tenant authentication (tenantId, tenantSlug, role).
 *
 * Note: The actual type augmentation is done in src/lib/auth.ts
 * using module augmentation. This file serves as documentation
 * and can be used for additional type exports if needed.
 */
import type { Role } from "@prisma/client";

/**
 * User object with tenant context
 */
export interface TenantUser {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  tenantSlug: string;
  role: Role;
}

/**
 * Session with tenant-aware user
 */
export interface TenantSession {
  user: TenantUser;
  expires: string;
}
