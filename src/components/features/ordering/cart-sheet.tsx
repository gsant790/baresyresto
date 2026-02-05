"use client";

import { useState, useEffect } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { CartItem } from "./cart-item";
import type { CartStore } from "@/lib/cart-store";
import { DEFAULT_TIP_PERCENTAGES } from "@/lib/cart-store";

/**
 * CartSheet Component
 *
 * A slide-up drawer that displays the cart contents, totals, and checkout.
 * Shows breakdown of subtotal, VAT, optional tip, and grand total.
 * Allows customers to review and modify their order before submission.
 */

interface CartSheetProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartStore;
  onCheckout: (tipPercentage: number, customerNotes: string) => void;
  isSubmitting?: boolean;
  locale?: string;
  currency?: string;
  tipPercentages?: number[];
  tipEnabled?: boolean;
}

export function CartSheet({
  isOpen,
  onClose,
  cart,
  onCheckout,
  isSubmitting = false,
  locale = "es",
  currency = "EUR",
  tipPercentages = DEFAULT_TIP_PERCENTAGES,
  tipEnabled = true,
}: CartSheetProps) {
  const [selectedTip, setSelectedTip] = useState(0);
  const [customerNotes, setCustomerNotes] = useState("");

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Calculate totals
  const tipAmount = cart.calculateTip(selectedTip);
  const total = cart.calculateTotal(selectedTip);

  // Format currency helper
  const formatPrice = (amount: number) =>
    formatCurrency(amount, currency, locale === "en" ? "en-GB" : "es-ES");

  // Translation strings
  const t = {
    cart: locale === "en" ? "Your Order" : "Tu Pedido",
    empty: locale === "en" ? "Your cart is empty" : "Tu carrito esta vacio",
    emptyHint:
      locale === "en"
        ? "Add some dishes to get started"
        : "Agrega platos para comenzar",
    subtotal: locale === "en" ? "Subtotal" : "Subtotal",
    vat: locale === "en" ? "VAT" : "IVA",
    tip: locale === "en" ? "Tip" : "Propina",
    total: locale === "en" ? "Total" : "Total",
    placeOrder: locale === "en" ? "Place Order" : "Realizar Pedido",
    processing: locale === "en" ? "Processing..." : "Procesando...",
    notes:
      locale === "en"
        ? "Additional notes for your order"
        : "Notas adicionales para tu pedido",
    notesPlaceholder:
      locale === "en"
        ? "Any special requests for the kitchen..."
        : "Cualquier solicitud especial para la cocina...",
    noTip: locale === "en" ? "No tip" : "Sin propina",
    items: locale === "en" ? "items" : "items",
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-40",
          "transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50",
          "bg-surface-dark rounded-t-3xl",
          "shadow-2xl shadow-black/40",
          "transform transition-transform duration-300 ease-out",
          "max-h-[90vh] flex flex-col",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label={t.cart}
      >
        {/* Handle bar */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1.5 rounded-full bg-separator" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-separator">
          <h2 className="text-lg font-bold text-text-primary-dark">{t.cart}</h2>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              "text-text-secondary hover:text-text-primary-dark hover:bg-card-dark",
              "transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            )}
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {cart.items.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-12">
              <span className="material-symbols-outlined text-5xl text-text-muted mb-3">
                shopping_cart
              </span>
              <p className="text-text-primary-dark font-medium mb-1">{t.empty}</p>
              <p className="text-text-secondary text-sm">{t.emptyHint}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Cart items */}
              <div className="space-y-3">
                {cart.items.map((item) => (
                  <CartItem
                    key={item.dishId}
                    item={item}
                    onUpdateQuantity={(qty) => cart.updateQuantity(item.dishId, qty)}
                    onUpdateNotes={(notes) => cart.updateNotes(item.dishId, notes)}
                    onRemove={() => cart.removeItem(item.dishId)}
                    locale={locale}
                    currency={currency}
                  />
                ))}
              </div>

              {/* Order notes */}
              <div>
                <label className="block text-sm font-medium text-text-primary-dark mb-2">
                  {t.notes}
                </label>
                <textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder={t.notesPlaceholder}
                  rows={2}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg text-sm",
                    "bg-card-dark border border-separator",
                    "text-text-primary-dark placeholder:text-text-muted",
                    "focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary",
                    "resize-none"
                  )}
                />
              </div>

              {/* Tip selection */}
              {tipEnabled && (
                <div>
                  <label className="block text-sm font-medium text-text-primary-dark mb-2">
                    {t.tip}
                  </label>
                  <div className="flex gap-2">
                    {tipPercentages.map((percentage) => (
                      <button
                        key={percentage}
                        type="button"
                        onClick={() => setSelectedTip(percentage)}
                        className={cn(
                          "flex-1 py-2 px-3 rounded-lg text-sm font-medium",
                          "transition-all duration-200",
                          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                          selectedTip === percentage
                            ? "bg-primary text-white shadow-lg shadow-primary/30"
                            : "bg-card-dark text-text-secondary border border-separator hover:border-primary/50"
                        )}
                      >
                        {percentage === 0 ? t.noTip : `${percentage}%`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="space-y-2 pt-4 border-t border-separator">
                {/* Subtotal */}
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">{t.subtotal}</span>
                  <span className="text-text-primary-dark">
                    {formatPrice(cart.subtotal)}
                  </span>
                </div>

                {/* VAT */}
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">
                    {t.vat} ({cart.vatRate}%)
                  </span>
                  <span className="text-text-primary-dark">
                    {formatPrice(cart.vatAmount)}
                  </span>
                </div>

                {/* Tip (if selected) */}
                {selectedTip > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">
                      {t.tip} ({selectedTip}%)
                    </span>
                    <span className="text-text-primary-dark">
                      {formatPrice(tipAmount)}
                    </span>
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between pt-2 border-t border-separator">
                  <span className="text-lg font-bold text-text-primary-dark">
                    {t.total}
                  </span>
                  <span className="text-lg font-bold text-primary">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with checkout button */}
        {cart.items.length > 0 && (
          <div className="p-4 border-t border-separator bg-surface-dark">
            <button
              type="button"
              onClick={() => onCheckout(selectedTip, customerNotes)}
              disabled={isSubmitting}
              className={cn(
                "w-full h-14 rounded-xl font-bold text-white",
                "transition-all duration-200",
                "shadow-lg shadow-primary/20",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-dark",
                isSubmitting
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
                <span>
                  {t.placeOrder} - {formatPrice(total)}
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default CartSheet;
