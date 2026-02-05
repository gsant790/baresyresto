"use client";

import { useState } from "react";
import { PaymentMethod } from "@prisma/client";
import { cn, formatCurrency } from "@/lib/utils";
import { PaymentMethodSelector } from "./payment-method-selector";

/**
 * CloseTableModal Component
 *
 * Modal for closing a table and processing payment.
 * Shows order summary, allows selecting payment method, and confirms closure.
 */

interface OrderSummary {
  id: string;
  orderNumber: number;
  status: string;
  subtotal: number;
  vatAmount: number;
  tipAmount: number;
  total: number;
  createdAt: Date;
  items: {
    id: string;
    dishName: string;
    dishNameEn: string | null;
    quantity: number;
    unitPrice: number;
    status: string;
  }[];
}

interface CloseTableModalProps {
  tableNumber: number;
  tableName?: string | null;
  orders: OrderSummary[];
  combinedTotal: number;
  onClose: () => void;
  onConfirm: (paymentMethod: PaymentMethod) => void;
  isLoading?: boolean;
  error?: string | null;
  currency?: string;
  locale?: string;
  translations: {
    title: string;
    closeTable: string;
    selectPaymentMethod: string;
    orderSummary: string;
    order: string;
    items: string;
    subtotal: string;
    vat: string;
    tip: string;
    total: string;
    combinedTotal: string;
    confirm: string;
    cancel: string;
    processing: string;
    noOrders: string;
    paymentMethods: {
      cash: string;
      card: string;
      bizum: string;
    };
  };
}

export function CloseTableModal({
  tableNumber,
  tableName,
  orders,
  combinedTotal,
  onClose,
  onConfirm,
  isLoading = false,
  error = null,
  currency = "EUR",
  locale = "es",
  translations: t,
}: CloseTableModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  // Format currency helper
  const formatPrice = (amount: number) =>
    formatCurrency(amount, currency, locale === "en" ? "en-GB" : "es-ES");

  const handleConfirm = () => {
    if (selectedMethod) {
      onConfirm(selectedMethod);
    }
  };

  // Prevent closing when clicking inside modal
  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-auto">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg bg-surface-dark rounded-xl border border-separator shadow-2xl my-8"
        onClick={handleModalClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="close-table-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-separator">
          <div>
            <h2
              id="close-table-title"
              className="text-lg font-semibold text-text-primary-dark"
            >
              {t.title}
            </h2>
            <p className="text-sm text-text-secondary">
              {t.closeTable} {tableNumber}
              {tableName && ` - ${tableName}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className={cn(
              "p-1 text-text-muted hover:text-text-primary-dark rounded-lg hover:bg-hover-row",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Order summary */}
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-4xl text-text-muted mb-2">
                receipt_long
              </span>
              <p className="text-text-secondary">{t.noOrders}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider">
                {t.orderSummary}
              </h3>

              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-card-dark rounded-lg border border-separator p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-text-primary-dark">
                      {t.order} #{order.orderNumber}
                    </span>
                    <span className="text-sm text-text-secondary">
                      {order.items.length} {t.items}
                    </span>
                  </div>

                  {/* Order items */}
                  <div className="space-y-1 mb-3">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-text-secondary">
                          {item.quantity}x{" "}
                          {locale === "en" && item.dishNameEn
                            ? item.dishNameEn
                            : item.dishName}
                        </span>
                        <span className="text-text-primary-dark">
                          {formatPrice(item.unitPrice * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Order totals */}
                  <div className="pt-2 border-t border-separator space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">{t.subtotal}</span>
                      <span className="text-text-primary-dark">
                        {formatPrice(order.subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">{t.vat}</span>
                      <span className="text-text-primary-dark">
                        {formatPrice(order.vatAmount)}
                      </span>
                    </div>
                    {order.tipAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-text-secondary">{t.tip}</span>
                        <span className="text-primary">
                          {formatPrice(order.tipAmount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium pt-1">
                      <span className="text-text-primary-dark">{t.total}</span>
                      <span className="text-text-primary-dark">
                        {formatPrice(order.total)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Combined total (if multiple orders) */}
              {orders.length > 1 && (
                <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <span className="text-lg font-bold text-text-primary-dark">
                    {t.combinedTotal}
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(combinedTotal)}
                  </span>
                </div>
              )}

              {/* Single order total display */}
              {orders.length === 1 && (
                <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <span className="text-lg font-bold text-text-primary-dark">
                    {t.total}
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(combinedTotal)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Payment method selection */}
          {orders.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider">
                {t.selectPaymentMethod}
              </h3>
              <PaymentMethodSelector
                selected={selectedMethod}
                onSelect={setSelectedMethod}
                disabled={isLoading}
                translations={t.paymentMethods}
              />
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-separator">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className={cn(
              "px-4 py-2 rounded-lg font-medium text-sm",
              "bg-surface-dark border border-separator text-text-secondary",
              "hover:bg-hover-row hover:text-text-primary-dark",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading || !selectedMethod || orders.length === 0}
            className={cn(
              "px-6 py-2 rounded-lg font-bold text-sm",
              "bg-primary text-white",
              "hover:bg-primary-dark",
              "shadow-lg shadow-primary/20",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center gap-2"
            )}
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-lg">
                  progress_activity
                </span>
                {t.processing}
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">
                  check_circle
                </span>
                {t.confirm}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CloseTableModal;
