import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTenantBySlug } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { MenuPageClient } from "./menu-page-client";

/**
 * Customer Menu Page
 *
 * This is the public-facing menu page that customers access
 * by scanning QR codes at their tables.
 *
 * URL Pattern: /[locale]/menu/[tenantSlug]/[tableCode]
 * Example: /es/menu/la-tasca/ABC123
 *
 * The page displays the restaurant's menu and allows customers
 * to browse items and place orders.
 */

interface MenuPageProps {
  params: Promise<{
    locale: string;
    tenantSlug: string;
    tableCode: string;
  }>;
}

export async function generateMetadata({ params }: MenuPageProps) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);

  if (!tenant) {
    return { title: "Menu Not Found" };
  }

  return {
    title: `Menu - ${tenant.name}`,
    description: `Browse the menu at ${tenant.name}`,
  };
}

export default async function MenuPage({ params }: MenuPageProps) {
  const { locale, tenantSlug, tableCode } = await params;

  // Enable static rendering
  setRequestLocale(locale);

  // Validate tenant exists
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) {
    notFound();
  }

  // Validate table code exists for this tenant
  const table = await prisma.table.findFirst({
    where: {
      tenantId: tenant.id,
      qrCode: tableCode,
      isActive: true,
    },
    select: {
      id: true,
      number: true,
      name: true,
      status: true,
    },
  });

  if (!table) {
    notFound();
  }

  // Fetch categories for this tenant
  const categories = await prisma.category.findMany({
    where: {
      tenantId: tenant.id,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      nameEn: true,
      displayOrder: true,
    },
    orderBy: { displayOrder: "asc" },
  });

  // Fetch available dishes for this tenant
  const dishes = await prisma.dish.findMany({
    where: {
      tenantId: tenant.id,
      isAvailable: true,
      isInStock: true,
    },
    select: {
      id: true,
      name: true,
      nameEn: true,
      description: true,
      descriptionEn: true,
      price: true,
      imageUrl: true,
      allergens: true,
      displayOrder: true,
      category: {
        select: {
          id: true,
          name: true,
          nameEn: true,
          displayOrder: true,
        },
      },
    },
    orderBy: [{ category: { displayOrder: "asc" } }, { displayOrder: "asc" }],
  });

  // Get tenant settings
  const settings = await prisma.settings.findUnique({
    where: { tenantId: tenant.id },
    select: {
      vatRate: true,
      tipEnabled: true,
      tipPercentages: true,
      currency: true,
    },
  });

  // Transform dishes to include price as number
  const transformedDishes = dishes.map((dish) => ({
    ...dish,
    price: dish.price.toNumber(),
  }));

  return (
    <ErrorBoundary>
      <MenuPageClient
        tenant={{
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          logoUrl: tenant.logoUrl,
        }}
        table={{
          id: table.id,
          number: table.number,
          name: table.name,
        }}
        tableCode={tableCode}
        categories={categories}
        dishes={transformedDishes}
        settings={{
          vatRate: settings?.vatRate.toNumber() ?? 10,
          tipEnabled: settings?.tipEnabled ?? true,
          tipPercentages: settings?.tipPercentages ?? [0, 5, 10, 15],
          currency: settings?.currency ?? "EUR",
        }}
        locale={locale}
      />
    </ErrorBoundary>
  );
}
