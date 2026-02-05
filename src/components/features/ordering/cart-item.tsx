"use client";

import { useState } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import type { CartItem as CartItemType } from "@/lib/cart-store";

/**
 * CartItem Component
 *
 * Displays a single item in the cart with quantity controls and notes input.
 * Supports inline editing of notes for special requests.
 */

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (quantity: number) => void;
  onUpdateNotes: (notes: string) => void;
  onRemove: () => void;
  locale?: string;
  currency?: string;
  notesPlaceholder?: string;
}

export function CartItem({
  item,
  onUpdateQuantity,
  onUpdateNotes,
  onRemove,
  locale = "es",
  currency = "EUR",
  notesPlaceholder,
}: CartItemProps) {
  const [showNotes, setShowNotes] = useState(!!item.notes);

  // Get display name based on locale
  const displayName = locale === "en" && item.nameEn ? item.nameEn : item.name;

  // Calculate line total
  const lineTotal = item.price * item.quantity;

  // Default placeholder
  const defaultPlaceholder =
    locale === "en"
      ? "Special instructions (allergies, preferences...)"
      : "Instrucciones especiales (alergias, preferencias...)";

  return (
    <div className="bg-card-dark rounded-xl border border-separator overflow-hidden">
      <div className="p-3 flex gap-3">
        {/* Item image */}
        <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-surface-dark">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl text-text-muted">
                restaurant
              </span>
            </div>
          )}
        </div>

        {/* Item details */}
        <div className="flex-1 min-w-0">
          {/* Name and remove button */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-medium text-text-primary-dark text-sm leading-tight line-clamp-2">
              {displayName}
            </h4>
            <button
              type="button"
              onClick={onRemove}
              className={cn(
                "w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center",
                "text-text-muted hover:text-red-400 hover:bg-red-500/10",
                "transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              )}
              aria-label={locale === "en" ? "Remove item" : "Eliminar"}
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {/* Price per unit */}
          <p className="text-xs text-text-secondary mb-2">
            {formatCurrency(item.price, currency, locale === "en" ? "en-GB" : "es-ES")} x {item.quantity}
          </p>

          {/* Quantity controls and line total */}
          <div className="flex items-center justify-between">
            {/* Quantity controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onUpdateQuantity(item.quantity - 1)}
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center",
                  "bg-surface-dark text-text-secondary",
                  "hover:bg-red-500/20 hover:text-red-400",
                  "transition-colors",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                )}
                aria-label={locale === "en" ? "Decrease quantity" : "Reducir cantidad"}
              >
                <span className="material-symbols-outlined text-base">
                  {item.quantity === 1 ? "delete" : "remove"}
                </span>
              </button>

              <span className="w-8 text-center text-sm font-bold text-text-primary-dark">
                {item.quantity}
              </span>

              <button
                type="button"
                onClick={() => onUpdateQuantity(item.quantity + 1)}
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center",
                  "bg-primary text-white",
                  "hover:bg-primary-dark",
                  "transition-colors",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                )}
                aria-label={locale === "en" ? "Increase quantity" : "Aumentar cantidad"}
              >
                <span className="material-symbols-outlined text-base">add</span>
              </button>
            </div>

            {/* Line total */}
            <span className="text-sm font-bold text-primary">
              {formatCurrency(lineTotal, currency, locale === "en" ? "en-GB" : "es-ES")}
            </span>
          </div>
        </div>
      </div>

      {/* Notes section */}
      <div className="border-t border-separator">
        {showNotes ? (
          <div className="p-3">
            <textarea
              value={item.notes || ""}
              onChange={(e) => onUpdateNotes(e.target.value)}
              placeholder={notesPlaceholder || defaultPlaceholder}
              rows={2}
              className={cn(
                "w-full px-3 py-2 rounded-lg text-sm",
                "bg-surface-dark border border-separator",
                "text-text-primary-dark placeholder:text-text-muted",
                "focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary",
                "resize-none"
              )}
            />
            <button
              type="button"
              onClick={() => {
                onUpdateNotes("");
                setShowNotes(false);
              }}
              className="mt-2 text-xs text-text-secondary hover:text-red-400 transition-colors"
            >
              {locale === "en" ? "Remove notes" : "Eliminar notas"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowNotes(true)}
            className={cn(
              "w-full px-3 py-2 text-left text-xs text-text-secondary",
              "hover:bg-surface-dark hover:text-text-primary-dark",
              "transition-colors flex items-center gap-2"
            )}
          >
            <span className="material-symbols-outlined text-sm">edit_note</span>
            {locale === "en" ? "Add special instructions" : "Agregar instrucciones"}
          </button>
        )}
      </div>
    </div>
  );
}

export default CartItem;
