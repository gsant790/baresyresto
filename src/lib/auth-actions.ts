"use server";

import { signOut as nextAuthSignOut } from "@/lib/auth";

/**
 * Server action for signing out user
 * Wrapper around NextAuth signOut to be called from client components
 */
export async function logoutUser() {
  await nextAuthSignOut();
}
