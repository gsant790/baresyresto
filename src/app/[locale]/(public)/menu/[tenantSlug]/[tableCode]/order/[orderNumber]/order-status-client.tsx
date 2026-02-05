"use client";

import { useRouter } from "next/navigation";
import { cn, formatCurrency, formatRelativeTime } from "@/lib/utils";
import type { OrderStatus, OrderItemStatus } from "@prisma/client";

/**
 * OrderStatusClient Component
 *
 * Client-side component for the order tracking page.
 * Displays order status, items, and progress timeline.
 */

// Type definitions
interface OrderItem {
  id: string;
  dishId: string;
  dishName: string;
  dishNameEn?: string | null;
  dishImageUrl?: string | null;
  quantity: number;
  unitPrice: number;
  notes?: string | null;
  status: OrderItemStatus;
}

interface StatusHistoryEntry {
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  changedAt: string;
  notes?: string | null;
}

interface Order {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  customerNotes?: string | null;
  subtotal: number;
  vatAmount: number;
  tipAmount: number;
  total: number;
  createdAt: string;
  items: OrderItem[];
  statusHistory: StatusHistoryEntry[];
}

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
}

interface TableInfo {
  id: string;
  number: number;
  name?: string | null;
}

interface OrderStatusClientProps {
  tenant: TenantInfo;
  table: TableInfo;
  tableCode: string;
  order: Order;
  currency: string;
  locale: string;
}

// Status configuration
const statusConfig: Record<
  OrderStatus,
  {
    icon: string;
    colorClass: string;
    bgClass: string;
  }
> = {
  PENDING: {
    icon: "hourglass_empty",
    colorClass: "text-amber-400",
    bgClass: "bg-amber-400/20",
  },
  CONFIRMED: {
    icon: "thumb_up",
    colorClass: "text-blue-400",
    bgClass: "bg-blue-400/20",
  },
  IN_PROGRESS: {
    icon: "skillet",
    colorClass: "text-orange-400",
    bgClass: "bg-orange-400/20",
  },
  READY: {
    icon: "check_circle",
    colorClass: "text-success",
    bgClass: "bg-success/20",
  },
  DELIVERED: {
    icon: "task_alt",
    colorClass: "text-success",
    bgClass: "bg-success/20",
  },
  PAID: {
    icon: "payments",
    colorClass: "text-success",
    bgClass: "bg-success/20",
  },
  CANCELLED: {
    icon: "cancel",
    colorClass: "text-error",
    bgClass: "bg-error/20",
  },
};

// Order flow steps
const orderSteps: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "IN_PROGRESS",
  "READY",
  "DELIVERED",
];

export function OrderStatusClient({
  tenant,
  table,
  tableCode,
  order,
  currency,
  locale,
}: OrderStatusClientProps) {
  const router = useRouter();

  // Get table display name
  const tableDisplay =
    table.name || (locale === "en" ? `Table ${table.number}` : `Mesa ${table.number}`);

  // Format currency helper
  const formatPrice = (amount: number) =>
    formatCurrency(amount, currency, locale === "en" ? "en-GB" : "es-ES");

  // Translation strings
  const t = {
    order: locale === "en" ? "Order" : "Pedido",
    status: locale === "en" ? "Status" : "Estado",
    items: locale === "en" ? "Items" : "Items",
    summary: locale === "en" ? "Summary" : "Resumen",
    subtotal: locale === "en" ? "Subtotal" : "Subtotal",
    vat: locale === "en" ? "VAT" : "IVA",
    tip: locale === "en" ? "Tip" : "Propina",
    total: locale === "en" ? "Total" : "Total",
    backToMenu: locale === "en" ? "Back to Menu" : "Volver al Menu",
    placed: locale === "en" ? "Placed" : "Realizado",
    notes: locale === "en" ? "Notes" : "Notas",
    timeline: locale === "en" ? "Order Timeline" : "Historial del Pedido",
    statusLabels: {
      PENDING: locale === "en" ? "Pending" : "Pendiente",
      CONFIRMED: locale === "en" ? "Confirmed" : "Confirmado",
      IN_PROGRESS: locale === "en" ? "In Progress" : "En Preparacion",
      READY: locale === "en" ? "Ready" : "Listo",
      DELIVERED: locale === "en" ? "Delivered" : "Entregado",
      PAID: locale === "en" ? "Paid" : "Pagado",
      CANCELLED: locale === "en" ? "Cancelled" : "Cancelado",
    } as Record<OrderStatus, string>,
    itemStatusLabels: {
      PENDING: locale === "en" ? "Pending" : "Pendiente",
      IN_PROGRESS: locale === "en" ? "Preparing" : "Preparando",
      READY: locale === "en" ? "Ready" : "Listo",
      SERVED: locale === "en" ? "Served" : "Servido",
      CANCELLED: locale === "en" ? "Cancelled" : "Cancelado",
    } as Record<OrderItemStatus, string>,
  };

  // Get current step index for progress indicator
  const currentStepIndex = orderSteps.indexOf(order.status);
  const isCancelled = order.status === "CANCELLED";

  // Navigate back to menu
  const handleBackToMenu = () => {
    router.push(`/${locale}/menu/${tenant.slug}/${tableCode}`);
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-surface-dark border-b border-separator px-4 py-4">
        <div className="mx-auto max-w-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBackToMenu}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                "bg-card-dark text-text-secondary",
                "hover:bg-surface-dark hover:text-text-primary-dark",
                "transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              )}
              aria-label={t.backToMenu}
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="text-lg font-bold text-text-primary-dark">
                {t.order} #{order.orderNumber}
              </h1>
              <p className="text-sm text-text-secondary">
                {tenant.name} - {tableDisplay}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-md space-y-6">
          {/* Current status */}
          <div
            className={cn(
              "rounded-xl border border-separator p-4",
              statusConfig[order.status].bgClass
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center",
                  statusConfig[order.status].bgClass
                )}
              >
                <span
                  className={cn(
                    "material-symbols-outlined text-2xl",
                    statusConfig[order.status].colorClass
                  )}
                >
                  {statusConfig[order.status].icon}
                </span>
              </div>
              <div>
                <p className="text-sm text-text-secondary">{t.status}</p>
                <p
                  className={cn(
                    "text-xl font-bold",
                    statusConfig[order.status].colorClass
                  )}
                >
                  {t.statusLabels[order.status]}
                </p>
              </div>
            </div>
          </div>

          {/* Progress steps (only show for normal flow) */}
          {!isCancelled && order.status !== "PAID" && (
            <div className="bg-card-dark rounded-xl border border-separator p-4">
              <div className="flex justify-between items-center">
                {orderSteps.map((step, index) => {
                  const isCompleted = index < currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  const isPending = index > currentStepIndex;

                  return (
                    <div key={step} className="flex flex-col items-center">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                          isCompleted && "bg-success text-white",
                          isCurrent && "bg-primary text-white",
                          isPending && "bg-surface-dark text-text-muted"
                        )}
                      >
                        {isCompleted ? (
                          <span className="material-symbols-outlined text-sm">check</span>
                        ) : (
                          index + 1
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-[10px] mt-1 text-center",
                          isCurrent ? "text-primary font-medium" : "text-text-muted"
                        )}
                      >
                        {t.statusLabels[step].split(" ")[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Order items */}
          <div className="bg-card-dark rounded-xl border border-separator overflow-hidden">
            <div className="px-4 py-3 border-b border-separator">
              <h2 className="font-medium text-text-primary-dark">{t.items}</h2>
            </div>
            <div className="divide-y divide-separator">
              {order.items.map((item) => {
                const displayName =
                  locale === "en" && item.dishNameEn ? item.dishNameEn : item.dishName;

                return (
                  <div key={item.id} className="p-3 flex gap-3">
                    {/* Item image */}
                    <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-surface-dark">
                      {item.dishImageUrl ? (
                        <img
                          src={item.dishImageUrl}
                          alt={displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-xl text-text-muted">
                            restaurant
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Item details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-2">
                        <span className="text-sm font-medium text-text-primary-dark line-clamp-1">
                          {item.quantity}x {displayName}
                        </span>
                        <span className="text-sm text-text-secondary">
                          {formatPrice(item.unitPrice * item.quantity)}
                        </span>
                      </div>
                      {item.notes && (
                        <p className="text-xs text-text-muted mt-0.5 line-clamp-1">
                          {item.notes}
                        </p>
                      )}
                      <span
                        className={cn(
                          "inline-block mt-1 text-xs px-2 py-0.5 rounded-full",
                          item.status === "READY" || item.status === "SERVED"
                            ? "bg-success/20 text-success"
                            : item.status === "IN_PROGRESS"
                            ? "bg-orange-400/20 text-orange-400"
                            : item.status === "CANCELLED"
                            ? "bg-error/20 text-error"
                            : "bg-amber-400/20 text-amber-400"
                        )}
                      >
                        {t.itemStatusLabels[item.status]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer notes */}
          {order.customerNotes && (
            <div className="bg-card-dark rounded-xl border border-separator p-4">
              <h3 className="font-medium text-text-primary-dark mb-2">{t.notes}</h3>
              <p className="text-sm text-text-secondary">{order.customerNotes}</p>
            </div>
          )}

          {/* Order summary */}
          <div className="bg-card-dark rounded-xl border border-separator p-4 space-y-2">
            <h2 className="font-medium text-text-primary-dark mb-3">{t.summary}</h2>

            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">{t.subtotal}</span>
              <span className="text-text-primary-dark">{formatPrice(order.subtotal)}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">{t.vat}</span>
              <span className="text-text-primary-dark">{formatPrice(order.vatAmount)}</span>
            </div>

            {order.tipAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">{t.tip}</span>
                <span className="text-text-primary-dark">{formatPrice(order.tipAmount)}</span>
              </div>
            )}

            <div className="flex justify-between pt-2 border-t border-separator">
              <span className="font-bold text-text-primary-dark">{t.total}</span>
              <span className="font-bold text-primary">{formatPrice(order.total)}</span>
            </div>

            <div className="flex justify-between text-xs pt-2">
              <span className="text-text-muted">{t.placed}</span>
              <span className="text-text-muted">
                {formatRelativeTime(order.createdAt, locale === "en" ? "en-GB" : "es-ES")}
              </span>
            </div>
          </div>

          {/* Timeline */}
          {order.statusHistory.length > 0 && (
            <div className="bg-card-dark rounded-xl border border-separator p-4">
              <h2 className="font-medium text-text-primary-dark mb-4">{t.timeline}</h2>
              <div className="space-y-4">
                {order.statusHistory.map((entry, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="relative">
                      <div
                        className={cn(
                          "w-3 h-3 rounded-full",
                          index === 0 ? "bg-primary" : "bg-separator"
                        )}
                      />
                      {index < order.statusHistory.length - 1 && (
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-separator" />
                      )}
                    </div>
                    <div className="flex-1 -mt-0.5">
                      <p className="text-sm font-medium text-text-primary-dark">
                        {t.statusLabels[entry.toStatus]}
                      </p>
                      <p className="text-xs text-text-muted">
                        {formatRelativeTime(entry.changedAt, locale === "en" ? "en-GB" : "es-ES")}
                      </p>
                      {entry.notes && (
                        <p className="text-xs text-text-secondary mt-1">{entry.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="sticky bottom-0 z-30 bg-surface-dark border-t border-separator p-4">
        <div className="mx-auto max-w-md">
          <button
            type="button"
            onClick={handleBackToMenu}
            className={cn(
              "w-full h-12 rounded-xl font-medium",
              "bg-card-dark text-text-secondary border border-separator",
              "hover:bg-surface-dark hover:text-text-primary-dark",
              "transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            )}
          >
            <span className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">menu_book</span>
              {t.backToMenu}
            </span>
          </button>
        </div>
      </footer>
    </div>
  );
}

export default OrderStatusClient;
