import { notFound, redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getTenantBySlug } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { InventoryPageClient } from "./inventory-page-client";

/**
 * Inventory Overview Page
 *
 * Server component that fetches initial inventory data and renders
 * the client-side inventory management interface.
 *
 * URL: /[locale]/[tenantSlug]/inventory
 */

interface InventoryPageProps {
  params: Promise<{
    locale: string;
    tenantSlug: string;
  }>;
}

export async function generateMetadata({ params }: InventoryPageProps) {
  const { locale, tenantSlug } = await params;
  const t = await getTranslations({ locale, namespace: "inventory" });
  const tenant = await getTenantBySlug(tenantSlug);

  return {
    title: tenant ? `${t("title")} - ${tenant.name}` : t("title"),
  };
}

export default async function InventoryPage({ params }: InventoryPageProps) {
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
    redirect(`/${locale}/${session.user.tenantSlug}/inventory`);
  }

  // Verify tenant exists
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) {
    notFound();
  }

  // Fetch initial products data
  const products = await prisma.product.findMany({
    where: {
      tenantId: tenant.id,
      isActive: true,
    },
    orderBy: { name: "asc" },
  });

  // Calculate stock status for each product
  const productsWithStatus = products.map((product) => ({
    ...product,
    stockStatus: getStockStatus(
      Number(product.quantity),
      Number(product.alertThreshold)
    ),
  }));

  // Get inventory stats
  const stats = {
    total: products.length,
    inStock: productsWithStatus.filter((p) => p.stockStatus === "in-stock").length,
    lowStock: productsWithStatus.filter((p) => p.stockStatus === "low-stock").length,
    outOfStock: productsWithStatus.filter((p) => p.stockStatus === "out-of-stock").length,
  };

  // Get low stock products for alerts
  const lowStockProducts = productsWithStatus
    .filter((p) => p.stockStatus !== "in-stock")
    .map((p) => ({
      id: p.id,
      name: p.name,
      quantity: Number(p.quantity),
      alertThreshold: Number(p.alertThreshold),
      unit: p.unit,
    }));

  const t = await getTranslations({ locale, namespace: "inventory" });
  const commonT = await getTranslations({ locale, namespace: "common" });

  return (
    <InventoryPageClient
      initialProducts={productsWithStatus}
      stats={stats}
      lowStockProducts={lowStockProducts}
      tenantSlug={tenantSlug}
      locale={locale}
      translations={{
        title: t("title"),
        addProduct: t("addProduct"),
        products: t("products"),
        quantity: t("quantity"),
        unit: t("unit"),
        alertThreshold: t("alertThreshold"),
        lowStock: t("lowStock"),
        search: commonT("search"),
        noResults: commonT("noResults"),
      }}
    />
  );
}

/**
 * Helper function to determine stock status based on quantity and threshold.
 */
function getStockStatus(
  quantity: number,
  alertThreshold: number
): "in-stock" | "low-stock" | "out-of-stock" {
  if (quantity === 0) {
    return "out-of-stock";
  }
  if (quantity <= alertThreshold) {
    return "low-stock";
  }
  return "in-stock";
}
