"use client";

import { useState } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import type { CartStore } from "@/lib/cart-store";
import { DEFAULT_TIP_PERCENTAGES } from "@/lib/cart-store";

/**
 * OrderForm Component
 *
 * Final step before order submission.
 * Shows order summary, tip selection, notes input, and submit button.
 * Displayed after customer confirms their cart.
 */

interface OrderFormProps {
  cart: CartStore;
  onSubmit: (tipPercentage: number, customerNotes: string) => void;
  onBack: () => void;
  isSubmitting?: boolean;
  locale?: string;
  currency?: string;
  tipPercentages?: number[];
  tipEnabled?: boolean;
}

export function OrderForm({
  cart,
  onSubmit,
  onBack,
  isSubmitting = false,
  locale = "es",
  currency = "EUR",
  tipPercentages = DEFAULT_TIP_PERCENTAGES,
  tipEnabled = true,
}: OrderFormProps) {
  const [selectedTip, setSelectedTip] = useState(0);
  const [customerNotes, setCustomerNotes] = useState("");

  // Calculate totals
  const tipAmount = cart.calculateTip(selectedTip);
  const total = cart.calculateTotal(selectedTip);

  // Format currency helper
  const formatPrice = (amount: number) =>
    formatCurrency(amount, currency, locale === "en" ? "en-GB" : "es-ES");

  // Translation strings
  const t = {
    title: locale === "en" ? "Confirm Order" : "Confirmar Pedido",
    orderSummary: locale === "en" ? "Order Summary" : "Resumen del Pedido",
    subtotal: locale === "en" ? "Subtotal" : "Subtotal",
    vat: locale === "en" ? "VAT" : "IVA",
    tip: locale === "en" ? "Add a tip?" : "Agregar propina?",
    tipDescription:
      locale === "en"
        ? "Your tip goes directly to our staff"
        : "Tu propina va directamente al personal",
    total: locale === "en" ? "Total" : "Total",
    notes: locale === "en" ? "Additional Notes" : "Notas Adicionales",
    notesPlaceholder:
      locale === "en"
        ? "Any allergies or special requests?"
        : "Alergias o solicitudes especiales?",
    back: locale === "en" ? "Back" : "Volver",
    submit: locale === "en" ? "Place Order" : "Realizar Pedido",
    processing: locale === "en" ? "Sending..." : "Enviando...",
    noTip: locale === "en" ? "No tip" : "Sin propina",
    items: locale === "en" ? "item" : "item",
    itemsPlural: locale === "en" ? "items" : "items",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(selectedTip, customerNotes);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            "bg-card-dark text-text-secondary",
            "hover:bg-surface-dark hover:text-text-primary-dark",
            "transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          )}
          aria-label={t.back}
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-xl font-bold text-text-primary-dark">{t.title}</h2>
      </div>

      {/* Order summary */}
      <div className="bg-card-dark rounded-xl border border-separator p-4 space-y-3">
        <h3 className="font-medium text-text-primary-dark">{t.orderSummary}</h3>

        {/* Items list */}
        <div className="space-y-2">
          {cart.items.map((item) => {
            const displayName = locale === "en" && item.nameEn ? item.nameEn : item.name;
            return (
              <div key={item.dishId} className="flex justify-between text-sm">
                <span className="text-text-secondary">
                  {item.quantity}x {displayName}
                </span>
                <span className="text-text-primary-dark">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Subtotal */}
        <div className="pt-2 border-t border-separator">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">{t.subtotal}</span>
            <span className="text-text-primary-dark">{formatPrice(cart.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-text-secondary">
              {t.vat} ({cart.vatRate}%)
            </span>
            <span className="text-text-primary-dark">{formatPrice(cart.vatAmount)}</span>
          </div>
        </div>
      </div>

      {/* Tip selection */}
      {tipEnabled && (
        <div className="bg-card-dark rounded-xl border border-separator p-4 space-y-3">
          <div>
            <h3 className="font-medium text-text-primary-dark">{t.tip}</h3>
            <p className="text-xs text-text-secondary">{t.tipDescription}</p>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {tipPercentages.map((percentage) => (
              <button
                key={percentage}
                type="button"
                onClick={() => setSelectedTip(percentage)}
                className={cn(
                  "py-3 rounded-lg text-sm font-medium",
                  "transition-all duration-200",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  selectedTip === percentage
                    ? "bg-primary text-white shadow-lg shadow-primary/30"
                    : "bg-surface-dark text-text-secondary border border-separator hover:border-primary/50"
                )}
              >
                {percentage === 0 ? t.noTip : `${percentage}%`}
              </button>
            ))}
          </div>

          {selectedTip > 0 && (
            <div className="flex justify-between text-sm pt-2">
              <span className="text-text-secondary">
                {t.tip.replace("?", "")} ({selectedTip}%)
              </span>
              <span className="text-primary font-medium">{formatPrice(tipAmount)}</span>
            </div>
          )}
        </div>
      )}

      {/* Additional notes */}
      <div className="space-y-2">
        <label
          htmlFor="customer-notes"
          className="block text-sm font-medium text-text-primary-dark"
        >
          {t.notes}
        </label>
        <textarea
          id="customer-notes"
          value={customerNotes}
          onChange={(e) => setCustomerNotes(e.target.value)}
          placeholder={t.notesPlaceholder}
          rows={3}
          disabled={isSubmitting}
          className={cn(
            "w-full px-4 py-3 rounded-xl text-sm",
            "bg-card-dark border border-separator",
            "text-text-primary-dark placeholder:text-text-muted",
            "focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary",
            "resize-none",
            "disabled:opacity-50"
          )}
        />
      </div>

      {/* Total and submit */}
      <div className="space-y-4 pt-4 border-t border-separator">
        {/* Grand total */}
        <div className="flex justify-between items-center">
          <div>
            <span className="text-lg font-bold text-text-primary-dark">{t.total}</span>
            <span className="text-xs text-text-secondary block">
              {cart.itemCount} {cart.itemCount === 1 ? t.items : t.itemsPlural}
            </span>
          </div>
          <span className="text-2xl font-bold text-primary">{formatPrice(total)}</span>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting || cart.itemCount === 0}
          className={cn(
            "w-full h-14 rounded-xl font-bold text-white",
            "transition-all duration-200",
            "shadow-lg shadow-primary/20",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background-dark",
            isSubmitting || cart.itemCount === 0
              ? "bg-primary/50 cursor-not-allowed"
              : "bg-primary hover:bg-primary-dark"
          )}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined animate-spin">
                progress_activity
              </span>
              {t.processing}
            </span>
          ) : (
            t.submit
          )}
        </button>
      </div>
    </form>
  );
}

export default OrderForm;
