import { notFound, redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getTenantBySlug } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { OrdersPageClient } from "./orders-page-client";

/**
 * Orders Overview Page
 *
 * Server component that fetches orders data and renders
 * the client-side orders management interface.
 *
 * URL: /[locale]/[tenantSlug]/orders
 */

interface OrdersPageProps {
  params: Promise<{
    locale: string;
    tenantSlug: string;
  }>;
}

export async function generateMetadata({ params }: OrdersPageProps) {
  const { locale, tenantSlug } = await params;
  const t = await getTranslations({ locale, namespace: "orders" });
  const tenant = await getTenantBySlug(tenantSlug);

  return {
    title: tenant ? `${t("title")} - ${tenant.name}` : t("title"),
  };
}

export default async function OrdersPage({ params }: OrdersPageProps) {
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
    redirect(`/${locale}/${session.user.tenantSlug}/orders`);
  }

  // Verify tenant exists
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) {
    notFound();
  }

  // Fetch orders with related data
  const orders = await prisma.order.findMany({
    where: {
      tenantId: tenant.id,
    },
    include: {
      table: {
        select: {
          id: true,
          number: true,
          name: true,
          zone: true,
        },
      },
      items: {
        include: {
          dish: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100, // Limit to recent orders for performance
  });

  // Get order stats
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "PENDING").length,
    confirmed: orders.filter((o) => o.status === "CONFIRMED").length,
    inProgress: orders.filter((o) => o.status === "IN_PROGRESS").length,
    ready: orders.filter((o) => o.status === "READY").length,
    delivered: orders.filter((o) => o.status === "DELIVERED").length,
    paid: orders.filter((o) => o.status === "PAID").length,
    cancelled: orders.filter((o) => o.status === "CANCELLED").length,
  };

  // Transform orders for client (convert Decimal to number)
  const ordersData = orders.map((order) => ({
    ...order,
    subtotal: order.subtotal.toNumber(),
    vatAmount: order.vatAmount.toNumber(),
    tipAmount: order.tipAmount.toNumber(),
    total: order.total.toNumber(),
    items: order.items.map((item) => ({
      ...item,
      unitPrice: item.unitPrice.toNumber(),
    })),
  }));

  const t = await getTranslations({ locale, namespace: "orders" });
  const commonT = await getTranslations({ locale, namespace: "common" });

  return (
    <OrdersPageClient
      initialOrders={ordersData}
      stats={stats}
      tenantSlug={tenantSlug}
      locale={locale}
      translations={{
        title: t("title"),
        newOrder: t("newOrder"),
        orderNumber: t("orderNumber"),
        table: t("table"),
        total: t("total"),
        subtotal: t("subtotal"),
        vat: t("vat"),
        tip: t("tip"),
        status: {
          pending: t("status.pending"),
          confirmed: t("status.confirmed"),
          inProgress: t("status.inProgress"),
          ready: t("status.ready"),
          delivered: t("status.delivered"),
          paid: t("status.paid"),
          cancelled: t("status.cancelled"),
        },
        search: commonT("search"),
        filter: commonT("filter"),
        noResults: commonT("noResults"),
      }}
    />
  );
}
