"use client";

import { cn, formatCurrency } from "@/lib/utils";

/**
 * OrderConfirmation Component
 *
 * Success screen displayed after an order is successfully placed.
 * Shows the order number, status, and what to expect next.
 * Provides options to view order status or start a new order.
 */

interface OrderConfirmationProps {
  orderNumber: number;
  total: number;
  tableName?: string | null;
  tableNumber: number;
  onViewStatus: () => void;
  onNewOrder: () => void;
  locale?: string;
  currency?: string;
}

export function OrderConfirmation({
  orderNumber,
  total,
  tableName,
  tableNumber,
  onViewStatus,
  onNewOrder,
  locale = "es",
  currency = "EUR",
}: OrderConfirmationProps) {
  // Format currency helper
  const formatPrice = (amount: number) =>
    formatCurrency(amount, currency, locale === "en" ? "en-GB" : "es-ES");

  // Get table display name
  const tableDisplay = tableName || `Mesa ${tableNumber}`;

  // Translation strings
  const t = {
    success: locale === "en" ? "Order Confirmed!" : "Pedido Confirmado!",
    orderNumber: locale === "en" ? "Order" : "Pedido",
    thankYou:
      locale === "en"
        ? "Thank you for your order"
        : "Gracias por tu pedido",
    preparing:
      locale === "en"
        ? "We're preparing your order. You'll receive it at your table soon."
        : "Estamos preparando tu pedido. Lo recibiras en tu mesa pronto.",
    total: locale === "en" ? "Total" : "Total",
    table: locale === "en" ? "Table" : "Mesa",
    viewStatus: locale === "en" ? "Track Order" : "Seguir Pedido",
    newOrder: locale === "en" ? "New Order" : "Nuevo Pedido",
    estimatedTime:
      locale === "en"
        ? "Estimated time: 15-25 min"
        : "Tiempo estimado: 15-25 min",
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-8 text-center">
      {/* Success animation/icon */}
      <div
        className={cn(
          "w-24 h-24 rounded-full bg-success/20 mb-6",
          "flex items-center justify-center",
          "animate-[bounce_1s_ease-in-out]"
        )}
      >
        <span className="material-symbols-outlined text-5xl text-success">
          check_circle
        </span>
      </div>

      {/* Success message */}
      <h1 className="text-2xl font-bold text-text-primary-dark mb-2">
        {t.success}
      </h1>

      {/* Order number */}
      <div className="mb-6">
        <span className="text-text-secondary text-sm">{t.orderNumber}</span>
        <div
          className={cn(
            "text-4xl font-bold text-primary",
            "mt-1 bg-primary/10 px-6 py-2 rounded-xl"
          )}
        >
          #{orderNumber}
        </div>
      </div>

      {/* Order details card */}
      <div
        className={cn(
          "w-full max-w-sm bg-card-dark rounded-xl border border-separator",
          "p-4 space-y-3 mb-6"
        )}
      >
        {/* Table */}
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">{t.table}</span>
          <span className="text-text-primary-dark font-medium">{tableDisplay}</span>
        </div>

        {/* Total */}
        <div className="flex justify-between">
          <span className="text-text-secondary">{t.total}</span>
          <span className="text-primary font-bold">{formatPrice(total)}</span>
        </div>

        {/* Estimated time */}
        <div className="pt-2 border-t border-separator">
          <div className="flex items-center justify-center gap-2 text-sm text-text-secondary">
            <span className="material-symbols-outlined text-base">schedule</span>
            {t.estimatedTime}
          </div>
        </div>
      </div>

      {/* Thank you message */}
      <div className="mb-8 max-w-xs">
        <p className="text-text-primary-dark font-medium mb-1">{t.thankYou}</p>
        <p className="text-text-secondary text-sm">{t.preparing}</p>
      </div>

      {/* Action buttons */}
      <div className="w-full max-w-sm space-y-3">
        {/* View status button */}
        <button
          type="button"
          onClick={onViewStatus}
          className={cn(
            "w-full h-14 rounded-xl font-bold",
            "bg-primary text-white",
            "hover:bg-primary-dark",
            "transition-colors",
            "shadow-lg shadow-primary/20",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          )}
        >
          <span className="flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">visibility</span>
            {t.viewStatus}
          </span>
        </button>

        {/* New order button */}
        <button
          type="button"
          onClick={onNewOrder}
          className={cn(
            "w-full h-12 rounded-xl font-medium",
            "bg-card-dark text-text-secondary border border-separator",
            "hover:bg-surface-dark hover:text-text-primary-dark",
            "transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          )}
        >
          <span className="flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">add</span>
            {t.newOrder}
          </span>
        </button>
      </div>
    </div>
  );
}

export default OrderConfirmation;
