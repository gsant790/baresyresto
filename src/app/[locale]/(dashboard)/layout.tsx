import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTenantBySlug } from "@/lib/tenant";
import { DashboardLayoutClient } from "@/components/layout/dashboard-layout-client";

/**
 * Dashboard Routes Layout
 *
 * This layout wraps all authenticated dashboard routes:
 * - /[locale]/[tenantSlug]/... - Restaurant admin/staff interfaces
 *
 * Requires authentication. Redirects to login if not authenticated.
 * The tenant context is determined by the URL slug and validated
 * against the user's session.
 */

interface DashboardLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function DashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  const { locale } = await params;

  // Check authentication
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  // Get tenant information
  const tenant = await getTenantBySlug(session.user.tenantSlug);

  return (
    <DashboardLayoutClient
      tenantSlug={session.user.tenantSlug}
      tenantName={tenant?.name || session.user.tenantSlug}
      locale={locale}
      userName={session.user.name}
      userEmail={session.user.email}
      userRole={session.user.role}
    >
      {children}
    </DashboardLayoutClient>
  );
}
