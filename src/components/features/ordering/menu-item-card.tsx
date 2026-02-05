"use client";

import { cn, formatCurrency } from "@/lib/utils";

/**
 * MenuItemCard Component
 *
 * Displays a menu item (dish) in the customer ordering interface.
 * Shows image, name, description, price, allergens, and quantity controls.
 * Mobile-optimized design with touch-friendly interactions.
 */

// Common allergen icons mapping (Material Symbols)
const allergenIcons: Record<string, string> = {
  gluten: "bakery_dining",
  crustaceans: "set_meal",
  eggs: "egg",
  fish: "phishing",
  peanuts: "nutrition",
  soybeans: "eco",
  milk: "water_drop",
  nuts: "forest",
  celery: "grass",
  mustard: "local_florist",
  sesame: "grain",
  sulphites: "science",
  lupin: "local_florist",
  molluscs: "set_meal",
};

// Allergen display names by locale
const allergenNames: Record<string, Record<string, string>> = {
  es: {
    gluten: "Gluten",
    crustaceans: "Crustaceos",
    eggs: "Huevos",
    fish: "Pescado",
    peanuts: "Cacahuetes",
    soybeans: "Soja",
    milk: "Lacteos",
    nuts: "Frutos secos",
    celery: "Apio",
    mustard: "Mostaza",
    sesame: "Sesamo",
    sulphites: "Sulfitos",
    lupin: "Altramuces",
    molluscs: "Moluscos",
  },
  en: {
    gluten: "Gluten",
    crustaceans: "Crustaceans",
    eggs: "Eggs",
    fish: "Fish",
    peanuts: "Peanuts",
    soybeans: "Soybeans",
    milk: "Milk",
    nuts: "Nuts",
    celery: "Celery",
    mustard: "Mustard",
    sesame: "Sesame",
    sulphites: "Sulphites",
    lupin: "Lupin",
    molluscs: "Molluscs",
  },
};

export interface MenuItemData {
  id: string;
  name: string;
  nameEn?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  price: number;
  imageUrl?: string | null;
  allergens: string[];
}

interface MenuItemCardProps {
  item: MenuItemData;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
  locale?: string;
  currency?: string;
}

export function MenuItemCard({
  item,
  quantity,
  onAdd,
  onRemove,
  locale = "es",
  currency = "EUR",
}: MenuItemCardProps) {
  // Determine display name based on locale
  const displayName = locale === "en" && item.nameEn ? item.nameEn : item.name;
  const displayDescription =
    locale === "en" && item.descriptionEn
      ? item.descriptionEn
      : item.description;

  const isInCart = quantity > 0;

  /**
   * Get allergen display name
   */
  const getAllergenName = (allergen: string): string => {
    const localeNames = allergenNames[locale] || allergenNames.es;
    return localeNames[allergen.toLowerCase()] || allergen;
  };

  return (
    <div
      className={cn(
        "relative flex overflow-hidden",
        "bg-card-dark rounded-xl border transition-all",
        isInCart
          ? "border-primary ring-1 ring-primary/20"
          : "border-separator"
      )}
    >
      {/* Image section */}
      <div className="relative w-28 h-28 flex-shrink-0 bg-surface-dark">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={displayName}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-text-muted">
              restaurant
            </span>
          </div>
        )}

        {/* Quantity badge when in cart */}
        {isInCart && (
          <div
            className={cn(
              "absolute -top-1 -right-1",
              "w-6 h-6 rounded-full bg-primary",
              "flex items-center justify-center",
              "text-xs font-bold text-white",
              "shadow-lg shadow-primary/40"
            )}
          >
            {quantity}
          </div>
        )}
      </div>

      {/* Content section */}
      <div className="flex-1 min-w-0 p-3 flex flex-col">
        {/* Name and price row */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-text-primary-dark text-sm leading-tight line-clamp-2">
            {displayName}
          </h3>
          <span className="text-sm font-bold text-primary whitespace-nowrap flex-shrink-0">
            {formatCurrency(item.price, currency, locale === "en" ? "en-GB" : "es-ES")}
          </span>
        </div>

        {/* Description */}
        {displayDescription && (
          <p className="text-xs text-text-secondary line-clamp-2 mb-2 flex-1">
            {displayDescription}
          </p>
        )}

        {/* Allergens and add button row */}
        <div className="flex items-end justify-between gap-2 mt-auto">
          {/* Allergens */}
          {item.allergens.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.allergens.slice(0, 4).map((allergen) => (
                <span
                  key={allergen}
                  title={getAllergenName(allergen)}
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center",
                    "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  )}
                >
                  <span className="material-symbols-outlined text-xs">
                    {allergenIcons[allergen.toLowerCase()] || "warning"}
                  </span>
                </span>
              ))}
              {item.allergens.length > 4 && (
                <span
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center",
                    "bg-amber-500/10 text-amber-400 border border-amber-500/20",
                    "text-[10px] font-bold"
                  )}
                >
                  +{item.allergens.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Add/Remove controls */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {isInCart ? (
              <>
                {/* Remove button */}
                <button
                  type="button"
                  onClick={onRemove}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    "bg-surface-dark text-text-secondary",
                    "hover:bg-red-500/20 hover:text-red-400",
                    "transition-colors",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  )}
                  aria-label="Remove one"
                >
                  <span className="material-symbols-outlined text-lg">
                    remove
                  </span>
                </button>

                {/* Quantity display */}
                <span className="w-6 text-center text-sm font-bold text-text-primary-dark">
                  {quantity}
                </span>

                {/* Add button */}
                <button
                  type="button"
                  onClick={onAdd}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    "bg-primary text-white",
                    "hover:bg-primary-dark",
                    "transition-colors",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  )}
                  aria-label="Add one more"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                </button>
              </>
            ) : (
              /* Initial add button */
              <button
                type="button"
                onClick={onAdd}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  "bg-primary text-white",
                  "hover:bg-primary-dark",
                  "transition-colors shadow-lg shadow-primary/30",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                )}
                aria-label="Add to cart"
              >
                <span className="material-symbols-outlined text-lg">add</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MenuItemCard;
