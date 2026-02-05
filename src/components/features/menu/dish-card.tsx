"use client";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { StockToggle } from "./stock-toggle";

/**
 * DishCard Component
 *
 * Displays a single dish's information in a card format.
 * Shows dish image, name, price, category, allergens, and availability toggle.
 *
 * Availability states:
 * - Available (isAvailable && isInStock): green indicator
 * - Out of stock (!isInStock): red indicator
 * - Unavailable (!isAvailable): gray indicator
 */

export interface DishData {
  id: string;
  name: string;
  nameEn?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  price: number;
  imageUrl?: string | null;
  isAvailable: boolean;
  isInStock: boolean;
  allergens: string[];
  displayOrder: number;
  category: {
    id: string;
    name: string;
    prepSector?: {
      id: string;
      name: string;
      code: string;
    } | null;
  };
}

interface DishCardProps {
  dish: DishData;
  onClick?: () => void;
  onToggleAvailable?: (id: string, isAvailable: boolean) => void;
  selected?: boolean;
  isToggling?: boolean;
  locale?: string;
}

// Common allergen icons (Material Symbols)
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

export function DishCard({
  dish,
  onClick,
  onToggleAvailable,
  selected,
  isToggling,
  locale = "es",
}: DishCardProps) {
  // Determine display name based on locale
  const displayName = locale === "en" && dish.nameEn ? dish.nameEn : dish.name;
  const displayDescription =
    locale === "en" && dish.descriptionEn
      ? dish.descriptionEn
      : dish.description;

  // Determine availability status
  const isFullyAvailable = dish.isAvailable && dish.isInStock;
  const isOutOfStock = !dish.isInStock;

  const handleToggle = (checked: boolean) => {
    onToggleAvailable?.(dish.id, checked);
  };

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden",
        "bg-card-dark rounded-xl border transition-all",
        "hover:shadow-md",
        selected
          ? "border-primary ring-2 ring-primary/20"
          : "border-separator",
        onClick && "cursor-pointer hover:bg-hover-row"
      )}
    >
      {/* Image section */}
      <div
        className="relative h-40 bg-surface-dark overflow-hidden"
        onClick={onClick}
      >
        {dish.imageUrl ? (
          <img
            src={dish.imageUrl}
            alt={displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-5xl text-text-muted">
              restaurant
            </span>
          </div>
        )}

        {/* Status overlay */}
        {!isFullyAvailable && (
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center",
              isOutOfStock
                ? "bg-red-500/80"
                : "bg-black/60"
            )}
          >
            <span className="text-white font-bold text-sm uppercase tracking-wider">
              {isOutOfStock ? "Out of Stock" : "Unavailable"}
            </span>
          </div>
        )}

        {/* Category badge */}
        <div className="absolute top-2 left-2">
          <span
            className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              "bg-black/60 text-white backdrop-blur-sm"
            )}
          >
            {dish.category.name}
          </span>
        </div>

        {/* Prep sector badge */}
        {dish.category.prepSector && (
          <div className="absolute top-2 right-2">
            <span
              className={cn(
                "px-2 py-1 rounded-full text-xs font-bold",
                "bg-primary/80 text-white backdrop-blur-sm"
              )}
            >
              {dish.category.prepSector.code}
            </span>
          </div>
        )}
      </div>

      {/* Content section */}
      <div className="flex-1 p-4 space-y-3" onClick={onClick}>
        {/* Name and price */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-text-primary-dark line-clamp-2">
            {displayName}
          </h3>
          <span className="text-lg font-bold text-primary whitespace-nowrap">
            {formatCurrency(dish.price)}
          </span>
        </div>

        {/* Description */}
        {displayDescription && (
          <p className="text-sm text-text-secondary line-clamp-2">
            {displayDescription}
          </p>
        )}

        {/* Allergens */}
        {dish.allergens.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {dish.allergens.slice(0, 5).map((allergen) => (
              <span
                key={allergen}
                title={allergen}
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center",
                  "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                )}
              >
                <span className="material-symbols-outlined text-sm">
                  {allergenIcons[allergen] || "warning"}
                </span>
              </span>
            ))}
            {dish.allergens.length > 5 && (
              <span
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center",
                  "bg-amber-500/10 text-amber-400 border border-amber-500/20",
                  "text-xs font-bold"
                )}
              >
                +{dish.allergens.length - 5}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer with availability toggle */}
      <div
        className={cn(
          "px-4 py-3 border-t border-separator",
          "flex items-center justify-between"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              isFullyAvailable
                ? "bg-green-500"
                : isOutOfStock
                ? "bg-red-500"
                : "bg-gray-500"
            )}
          />
          <span className="text-xs text-text-secondary">
            {isFullyAvailable
              ? "Available"
              : isOutOfStock
              ? "Out of Stock"
              : "Unavailable"}
          </span>
        </div>

        {onToggleAvailable && (
          <StockToggle
            checked={dish.isAvailable}
            onChange={handleToggle}
            disabled={isToggling}
            id={`dish-toggle-${dish.id}`}
          />
        )}
      </div>
    </div>
  );
}

export default DishCard;
