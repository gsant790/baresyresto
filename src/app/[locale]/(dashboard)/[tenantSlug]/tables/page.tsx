import { notFound, redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getTenantBySlug } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { TablesPageClient } from "./tables-page-client";

/**
 * Tables Overview Page
 *
 * Server component that fetches initial table data and renders
 * the client-side tables management interface.
 *
 * URL: /[locale]/[tenantSlug]/tables
 */

interface TablesPageProps {
  params: Promise<{
    locale: string;
    tenantSlug: string;
  }>;
}

export async function generateMetadata({ params }: TablesPageProps) {
  const { locale, tenantSlug } = await params;
  const t = await getTranslations({ locale, namespace: "tables" });
  const tenant = await getTenantBySlug(tenantSlug);

  return {
    title: tenant ? `${t("title")} - ${tenant.name}` : t("title"),
  };
}

export default async function TablesPage({ params }: TablesPageProps) {
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
    redirect(`/${locale}/${session.user.tenantSlug}/tables`);
  }

  // Verify tenant exists
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) {
    notFound();
  }

  // Fetch initial tables data
  const tables = await prisma.table.findMany({
    where: {
      tenantId: tenant.id,
      isActive: true,
    },
    orderBy: [{ zone: "asc" }, { number: "asc" }],
  });

  // Get table stats
  const stats = {
    available: tables.filter((t) => t.status === "AVAILABLE").length,
    occupied: tables.filter((t) => t.status === "OCCUPIED").length,
    reserved: tables.filter((t) => t.status === "RESERVED").length,
    cleaning: tables.filter((t) => t.status === "CLEANING").length,
    total: tables.length,
  };

  const t = await getTranslations({ locale, namespace: "tables" });

  return (
    <TablesPageClient
      initialTables={tables}
      stats={stats}
      tenantSlug={tenantSlug}
      tenantName={tenant.name}
      translations={{
        title: t("title"),
        addTable: t("addTable"),
        tableNumber: t("tableNumber"),
        capacity: t("capacity"),
        zone: t("zone"),
        qrCode: t("qrCode"),
        status: {
          available: t("status.available"),
          occupied: t("status.occupied"),
          reserved: t("status.reserved"),
          cleaning: t("status.cleaning"),
        },
      }}
    />
  );
}
