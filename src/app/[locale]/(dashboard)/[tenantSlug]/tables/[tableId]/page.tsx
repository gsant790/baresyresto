import { notFound, redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getTenantBySlug } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { buildTableUrl } from "@/lib/qr";
import { TableDetailClient } from "./table-detail-client";

/**
 * Table Detail Page
 *
 * Shows detailed information for a single table including:
 * - Table info (number, name, capacity, zone, status)
 * - QR code display and download
 * - Status update controls
 * - Close table functionality (for occupied tables)
 * - Edit and delete actions
 *
 * URL: /[locale]/[tenantSlug]/tables/[tableId]
 */

interface TableDetailPageProps {
  params: Promise<{
    locale: string;
    tenantSlug: string;
    tableId: string;
  }>;
}

export async function generateMetadata({ params }: TableDetailPageProps) {
  const { locale, tenantSlug, tableId } = await params;
  const t = await getTranslations({ locale, namespace: "tables" });
  const tenant = await getTenantBySlug(tenantSlug);

  if (!tenant) {
    return { title: t("title") };
  }

  const table = await prisma.table.findFirst({
    where: { id: tableId, tenantId: tenant.id },
  });

  if (!table) {
    return { title: t("title") };
  }

  return {
    title: `Table ${table.number} - ${tenant.name}`,
  };
}

export default async function TableDetailPage({ params }: TableDetailPageProps) {
  const { locale, tenantSlug, tableId } = await params;

  // Enable static rendering
  setRequestLocale(locale);

  // Verify authentication
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

  // Fetch table
  const table = await prisma.table.findFirst({
    where: {
      id: tableId,
      tenantId: tenant.id,
    },
  });

  if (!table) {
    notFound();
  }

  // Get tenant settings for currency
  const settings = await prisma.settings.findUnique({
    where: { tenantId: tenant.id },
  });

  // Build the menu URL for QR code
  const menuUrl = buildTableUrl(tenantSlug, table.qrCode, locale);

  const t = await getTranslations({ locale, namespace: "tables" });
  const commonT = await getTranslations({ locale, namespace: "common" });
  const paymentsT = await getTranslations({ locale, namespace: "payments" });

  return (
    <TableDetailClient
      table={table}
      menuUrl={menuUrl}
      tenantSlug={tenantSlug}
      locale={locale}
      currency={settings?.currency ?? "EUR"}
      translations={{
        title: t("title"),
        tableNumber: t("tableNumber"),
        capacity: t("capacity"),
        zone: t("zone"),
        qrCode: t("qrCode"),
        closeTable: t("closeTable"),
        status: {
          available: t("status.available"),
          occupied: t("status.occupied"),
          reserved: t("status.reserved"),
          cleaning: t("status.cleaning"),
        },
        edit: commonT("edit"),
        delete: commonT("delete"),
        save: commonT("save"),
        cancel: commonT("cancel"),
        back: commonT("back"),
      }}
      paymentTranslations={{
        title: paymentsT("title"),
        closeTable: paymentsT("closeTable"),
        selectPaymentMethod: paymentsT("selectPaymentMethod"),
        orderSummary: paymentsT("orderSummary"),
        order: paymentsT("order"),
        items: paymentsT("items"),
        subtotal: paymentsT("subtotal"),
        vat: paymentsT("vat"),
        tip: paymentsT("tip"),
        total: paymentsT("total"),
        combinedTotal: paymentsT("combinedTotal"),
        confirm: paymentsT("confirm"),
        cancel: paymentsT("cancel"),
        processing: paymentsT("processing"),
        noOrders: paymentsT("noOrders"),
        paymentMethods: {
          cash: paymentsT("methods.cash"),
          card: paymentsT("methods.card"),
          bizum: paymentsT("methods.bizum"),
        },
      }}
    />
  );
}
