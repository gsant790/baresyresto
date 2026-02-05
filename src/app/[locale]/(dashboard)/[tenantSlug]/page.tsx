import { notFound, redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getTenantBySlug } from "@/lib/tenant";
import { QuickActions } from "@/components/layout/quick-actions";

/**
 * Dashboard Home Page
 *
 * The main dashboard view for restaurant staff.
 * Shows overview stats, recent orders, and quick actions.
 *
 * URL: /[locale]/[tenantSlug]
 */

interface DashboardPageProps {
  params: Promise<{
    locale: string;
    tenantSlug: string;
  }>;
}

export async function generateMetadata({ params }: DashboardPageProps) {
  const { locale, tenantSlug } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });
  const tenant = await getTenantBySlug(tenantSlug);

  return {
    title: tenant ? `${t("title")} - ${tenant.name}` : t("title"),
  };
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale, tenantSlug } = await params;

  // Enable static rendering
  setRequestLocale(locale);

  // Verify authentication and tenant access
  const session = await auth();
  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  // Verify user has access to this tenant
  if (session.user.tenantSlug !== tenantSlug) {
    // User is trying to access a different tenant
    redirect(`/${locale}/${session.user.tenantSlug}`);
  }

  // Verify tenant exists
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "dashboard" });

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary-dark tracking-tight">
          {t("welcome", { name: session.user.name })}
        </h1>
        <p className="text-text-secondary mt-1">{tenant.name}</p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active Orders */}
        <div className="bg-card-dark rounded-xl border border-separator p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">
              {t("stats.activeOrders")}
            </span>
            <span className="material-symbols-outlined text-info">
              receipt_long
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold text-text-primary-dark">0</p>
          <p className="mt-1 text-xs text-text-muted">{t("stats.today")}</p>
        </div>

        {/* Tables Occupied */}
        <div className="bg-card-dark rounded-xl border border-separator p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">
              {t("stats.tablesOccupied")}
            </span>
            <span className="material-symbols-outlined text-warning">
              table_restaurant
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold text-text-primary-dark">0/0</p>
          <p className="mt-1 text-xs text-text-muted">{t("stats.available")}</p>
        </div>

        {/* Revenue Today */}
        <div className="bg-card-dark rounded-xl border border-separator p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">
              {t("stats.revenueToday")}
            </span>
            <span className="material-symbols-outlined text-success">euro</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-text-primary-dark">
            0.00 EUR
          </p>
          <p className="mt-1 text-xs text-text-muted">{t("stats.gross")}</p>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-card-dark rounded-xl border border-separator p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">
              {t("stats.lowStock")}
            </span>
            <span className="material-symbols-outlined text-error">
              warning
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold text-text-primary-dark">0</p>
          <p className="mt-1 text-xs text-text-muted">{t("stats.items")}</p>
        </div>
      </div>

      {/* Quick actions section */}
      <div>
        <h2 className="text-xl font-semibold text-text-primary-dark mb-4">
          Quick Actions
        </h2>
        <QuickActions tenantSlug={tenantSlug} locale={locale} />
      </div>

      {/* Recent activity section */}
      <div className="bg-card-dark rounded-xl border border-separator">
        <div className="border-b border-separator px-6 py-4">
          <h2 className="text-lg font-semibold text-text-primary-dark">
            {t("recentActivity")}
          </h2>
        </div>
        <div className="p-6">
          <p className="text-center text-text-secondary py-8">
            {t("noRecentActivity")}
          </p>
        </div>
      </div>
    </div>
  );
}
