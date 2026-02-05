import { notFound, redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getTenantBySlug } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { MenuPageClient } from "./menu-page-client";

/**
 * Menu Overview Page
 *
 * Server component that fetches initial menu data and renders
 * the client-side menu management interface.
 *
 * URL: /[locale]/[tenantSlug]/menu
 */

interface MenuPageProps {
  params: Promise<{
    locale: string;
    tenantSlug: string;
  }>;
}

export async function generateMetadata({ params }: MenuPageProps) {
  const { locale, tenantSlug } = await params;
  const t = await getTranslations({ locale, namespace: "menu" });
  const tenant = await getTenantBySlug(tenantSlug);

  return {
    title: tenant ? `${t("title")} - ${tenant.name}` : t("title"),
  };
}

export default async function MenuPage({ params }: MenuPageProps) {
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
    redirect(`/${locale}/${session.user.tenantSlug}/menu`);
  }

  // Verify tenant exists
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) {
    notFound();
  }

  // Fetch initial dishes data with categories
  const dishes = await prisma.dish.findMany({
    where: {
      tenantId: tenant.id,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          prepSector: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      },
    },
    orderBy: [{ category: { displayOrder: "asc" } }, { displayOrder: "asc" }, { name: "asc" }],
  });

  // Fetch categories with dish counts
  const categories = await prisma.category.findMany({
    where: {
      tenantId: tenant.id,
    },
    include: {
      prepSector: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      _count: {
        select: { dishes: true },
      },
    },
    orderBy: { displayOrder: "asc" },
  });

  // Calculate stats
  const stats = {
    total: dishes.length,
    available: dishes.filter((d) => d.isAvailable && d.isInStock).length,
    unavailable: dishes.filter((d) => !d.isAvailable).length,
    outOfStock: dishes.filter((d) => !d.isInStock).length,
    categories: categories.length,
  };

  // Transform data for client
  const dishesData = dishes.map((dish) => ({
    ...dish,
    price: dish.price.toNumber(),
  }));

  const categoriesData = categories.map((category) => ({
    ...category,
    dishCount: category._count.dishes,
  }));

  const t = await getTranslations({ locale, namespace: "menu" });
  const commonT = await getTranslations({ locale, namespace: "common" });

  return (
    <MenuPageClient
      initialDishes={dishesData}
      initialCategories={categoriesData}
      stats={stats}
      tenantSlug={tenantSlug}
      locale={locale}
      translations={{
        title: t("title"),
        addDish: t("addDish"),
        editDish: t("editDish"),
        searchPlaceholder: t("searchPlaceholder"),
        allCategories: t("allCategories"),
        available: t("available"),
        unavailable: t("unavailable"),
        outOfStock: t("outOfStock"),
        categories: t("categories"),
        noDishes: t("noDishes"),
        confirmDelete: t("confirmDelete"),
        edit: commonT("edit"),
        delete: commonT("delete"),
        save: commonT("save"),
        cancel: commonT("cancel"),
      }}
    />
  );
}
