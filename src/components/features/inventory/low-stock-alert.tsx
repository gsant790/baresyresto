"use client";

import type { Unit } from "@prisma/client";
import { cn } from "@/lib/utils";

/**
 * LowStockAlert Component
 *
 * Displays a banner or badge showing products with low or no stock.
 * Can be used as a summary widget or detailed list.
 */

export interface LowStockProduct {
  id: string;
  name: string;
  quantity: number;
  alertThreshold: number;
  unit: Unit;
}

interface LowStockAlertProps {
  products: LowStockProduct[];
  variant?: "banner" | "badge" | "list";
  onViewAll?: () => void;
  onProductClick?: (product: LowStockProduct) => void;
  maxDisplay?: number;
  className?: string;
}

// Unit display labels
const unitLabels: Record<Unit, string> = {
  KILOGRAM: "kg",
  GRAM: "g",
  LITER: "L",
  MILLILITER: "ml",
  UNIT: "units",
  PORTION: "portions",
};

/**
 * Badge variant - compact count indicator
 */
function LowStockBadge({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  if (count === 0) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold",
        count > 0 ? "bg-red-500/10 text-red-400 border border-red-500/20" : "",
        className
      )}
    >
      <span className="material-symbols-outlined text-sm">warning</span>
      {count} {count === 1 ? "item" : "items"} low
    </span>
  );
}

/**
 * Banner variant - alert bar with expandable details
 */
function LowStockBanner({
  products,
  onViewAll,
  onProductClick,
  maxDisplay = 3,
}: {
  products: LowStockProduct[];
  onViewAll?: () => void;
  onProductClick?: (product: LowStockProduct) => void;
  maxDisplay?: number;
}) {
  if (products.length === 0) return null;

  const outOfStock = products.filter((p) => p.quantity === 0);
  const lowStock = products.filter((p) => p.quantity > 0);
  const displayProducts = products.slice(0, maxDisplay);
  const remainingCount = products.length - maxDisplay;

  return (
    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <span className="material-symbols-outlined text-2xl text-red-400">
            warning
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-red-400 mb-1">
            Low Stock Alert
          </h3>
          <p className="text-sm text-text-secondary mb-3">
            {outOfStock.length > 0 && (
              <>
                <span className="text-red-400 font-semibold">
                  {outOfStock.length} out of stock
                </span>
                {lowStock.length > 0 && " and "}
              </>
            )}
            {lowStock.length > 0 && (
              <span className="text-orange-400 font-semibold">
                {lowStock.length} running low
              </span>
            )}
          </p>

          {/* Product chips */}
          <div className="flex flex-wrap gap-2">
            {displayProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => onProductClick?.(product)}
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  product.quantity === 0
                    ? "bg-red-500/20 text-red-300 hover:bg-red-500/30"
                    : "bg-orange-500/20 text-orange-300 hover:bg-orange-500/30"
                )}
              >
                <span>{product.name}</span>
                <span className="opacity-75">
                  {product.quantity.toFixed(1)} {unitLabels[product.unit]}
                </span>
              </button>
            ))}
            {remainingCount > 0 && (
              <span className="inline-flex items-center px-3 py-1.5 text-xs text-text-muted">
                +{remainingCount} more
              </span>
            )}
          </div>
        </div>

        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors"
          >
            View All
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * List variant - detailed list of low stock items
 */
function LowStockList({
  products,
  onProductClick,
  maxDisplay,
}: {
  products: LowStockProduct[];
  onProductClick?: (product: LowStockProduct) => void;
  maxDisplay?: number;
}) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <span className="material-symbols-outlined text-4xl text-green-400 mb-2">
          check_circle
        </span>
        <p className="text-sm text-text-secondary">
          All products are well stocked
        </p>
      </div>
    );
  }

  const displayProducts = maxDisplay ? products.slice(0, maxDisplay) : products;

  return (
    <div className="space-y-2">
      {displayProducts.map((product) => {
        const isOutOfStock = product.quantity === 0;
        const percentage = product.alertThreshold > 0
          ? Math.min((product.quantity / product.alertThreshold) * 100, 100)
          : 0;

        return (
          <button
            key={product.id}
            type="button"
            onClick={() => onProductClick?.(product)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
              "border",
              isOutOfStock
                ? "bg-red-500/5 border-red-500/20 hover:bg-red-500/10"
                : "bg-orange-500/5 border-orange-500/20 hover:bg-orange-500/10"
            )}
          >
            {/* Status indicator */}
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                isOutOfStock ? "bg-red-500/20" : "bg-orange-500/20"
              )}
            >
              <span
                className={cn(
                  "material-symbols-outlined text-lg",
                  isOutOfStock ? "text-red-400" : "text-orange-400"
                )}
              >
                {isOutOfStock ? "cancel" : "warning"}
              </span>
            </div>

            {/* Product info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary-dark truncate">
                {product.name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {/* Progress bar */}
                <div className="flex-1 h-1.5 bg-separator rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      isOutOfStock ? "bg-red-400" : "bg-orange-400"
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span
                  className={cn(
                    "text-xs font-medium",
                    isOutOfStock ? "text-red-400" : "text-orange-400"
                  )}
                >
                  {product.quantity.toFixed(1)} / {product.alertThreshold.toFixed(1)}{" "}
                  {unitLabels[product.unit]}
                </span>
              </div>
            </div>

            {/* Arrow */}
            <span className="material-symbols-outlined text-text-muted">
              chevron_right
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Main component that renders the appropriate variant
 */
export function LowStockAlert({
  products,
  variant = "banner",
  onViewAll,
  onProductClick,
  maxDisplay,
  className,
}: LowStockAlertProps) {
  if (variant === "badge") {
    return <LowStockBadge count={products.length} className={className} />;
  }

  if (variant === "list") {
    return (
      <div className={className}>
        <LowStockList
          products={products}
          onProductClick={onProductClick}
          maxDisplay={maxDisplay}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <LowStockBanner
        products={products}
        onViewAll={onViewAll}
        onProductClick={onProductClick}
        maxDisplay={maxDisplay}
      />
    </div>
  );
}

export default LowStockAlert;
