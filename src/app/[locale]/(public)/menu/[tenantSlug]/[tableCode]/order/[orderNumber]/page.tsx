import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTenantBySlug } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { OrderStatusClient } from "./order-status-client";

/**
 * Order Status Page
 *
 * Displays the current status of a customer's order.
 * Customers can track their order progress from pending to delivered.
 *
 * URL Pattern: /[locale]/menu/[tenantSlug]/[tableCode]/order/[orderNumber]
 * Example: /es/menu/la-tasca/ABC123/order/42
 */

interface OrderStatusPageProps {
  params: Promise<{
    locale: string;
    tenantSlug: string;
    tableCode: string;
    orderNumber: string;
  }>;
}

export async function generateMetadata({ params }: OrderStatusPageProps) {
  const { tenantSlug, orderNumber } = await params;
  const tenant = await getTenantBySlug(tenantSlug);

  if (!tenant) {
    return { title: "Order Not Found" };
  }

  return {
    title: `Order #${orderNumber} - ${tenant.name}`,
    description: `Track order #${orderNumber} at ${tenant.name}`,
  };
}

export default async function OrderStatusPage({ params }: OrderStatusPageProps) {
  const { locale, tenantSlug, tableCode, orderNumber } = await params;

  // Enable static rendering
  setRequestLocale(locale);

  // Parse order number
  const orderNum = parseInt(orderNumber, 10);
  if (isNaN(orderNum)) {
    notFound();
  }

  // Validate tenant exists
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) {
    notFound();
  }

  // Validate table exists
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
    },
  });

  if (!table) {
    notFound();
  }

  // Fetch order with items
  const order = await prisma.order.findFirst({
    where: {
      tenantId: tenant.id,
      tableId: table.id,
      orderNumber: orderNum,
    },
    include: {
      items: {
        include: {
          dish: {
            select: {
              id: true,
              name: true,
              nameEn: true,
              imageUrl: true,
            },
          },
        },
      },
      statusHistory: {
        orderBy: { changedAt: "desc" },
        take: 10,
      },
    },
  });

  if (!order) {
    notFound();
  }

  // Get tenant settings
  const settings = await prisma.settings.findUnique({
    where: { tenantId: tenant.id },
    select: {
      currency: true,
    },
  });

  // Transform order data
  const transformedOrder = {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    customerNotes: order.customerNotes,
    subtotal: order.subtotal.toNumber(),
    vatAmount: order.vatAmount.toNumber(),
    tipAmount: order.tipAmount.toNumber(),
    total: order.total.toNumber(),
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      dishId: item.dishId,
      dishName: item.dish.name,
      dishNameEn: item.dish.nameEn,
      dishImageUrl: item.dish.imageUrl,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toNumber(),
      notes: item.notes,
      status: item.status,
    })),
    statusHistory: order.statusHistory.map((h) => ({
      fromStatus: h.fromStatus,
      toStatus: h.toStatus,
      changedAt: h.changedAt.toISOString(),
      notes: h.notes,
    })),
  };

  return (
    <ErrorBoundary>
      <OrderStatusClient
        tenant={{
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
        }}
        table={{
          id: table.id,
          number: table.number,
          name: table.name,
        }}
        tableCode={tableCode}
        order={transformedOrder}
        currency={settings?.currency ?? "EUR"}
        locale={locale}
      />
    </ErrorBoundary>
  );
}
