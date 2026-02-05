import { notFound, redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getTenantBySlug } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { ProductDetailClient } from "./product-detail-client";

/**
 * Product Detail Page
 *
 * Shows detailed information for a single inventory product including:
 * - Product info (name, unit, quantity, threshold, cost)
 * - Stock status and history
 * - Edit and delete actions
 * - Quantity adjustment controls
 *
 * URL: /[locale]/[tenantSlug]/inventory/[productId]
 */

interface ProductDetailPageProps {
  params: Promise<{
    locale: string;
    tenantSlug: string;
    productId: string;
  }>;
}

export async function generateMetadata({ params }: ProductDetailPageProps) {
  const { locale, tenantSlug, productId } = await params;
  const t = await getTranslations({ locale, namespace: "inventory" });
  const tenant = await getTenantBySlug(tenantSlug);

  if (!tenant) {
    return { title: t("title") };
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId: tenant.id },
  });

  if (!product) {
    return { title: t("title") };
  }

  return {
    title: `${product.name} - ${tenant.name}`,
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { locale, tenantSlug, productId } = await params;

  // Enable static rendering
  setRequestLocale(locale);

  // Verify authentication
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

  // Fetch product
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      tenantId: tenant.id,
    },
  });

  if (!product) {
    notFound();
  }

  // Calculate stock status
  const stockStatus = getStockStatus(
    Number(product.quantity),
    Number(product.alertThreshold)
  );

  const productWithStatus = {
    ...product,
    stockStatus,
  };

  const t = await getTranslations({ locale, namespace: "inventory" });
  const commonT = await getTranslations({ locale, namespace: "common" });

  return (
    <ProductDetailClient
      product={productWithStatus}
      tenantSlug={tenantSlug}
      locale={locale}
      translations={{
        title: t("title"),
        quantity: t("quantity"),
        unit: t("unit"),
        alertThreshold: t("alertThreshold"),
        edit: commonT("edit"),
        delete: commonT("delete"),
        save: commonT("save"),
        cancel: commonT("cancel"),
        back: commonT("back"),
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
