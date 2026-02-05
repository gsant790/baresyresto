"use client";

import { cn } from "@/lib/utils";

/**
 * CategoryList Component
 *
 * Displays a list/tabs of categories for filtering the menu.
 * Shows category name, dish count, and prep sector badge.
 * Supports both sidebar and tabs layout modes.
 */

export interface CategoryData {
  id: string;
  name: string;
  nameEn?: string | null;
  description?: string | null;
  displayOrder: number;
  isActive: boolean;
  dishCount?: number;
  prepSector?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

interface CategoryListProps {
  categories: CategoryData[];
  selectedCategoryId?: string | null;
  onCategorySelect: (categoryId: string | null) => void;
  layout?: "tabs" | "sidebar";
  showAll?: boolean;
  allLabel?: string;
  totalDishCount?: number;
  locale?: string;
}

export function CategoryList({
  categories,
  selectedCategoryId,
  onCategorySelect,
  layout = "tabs",
  showAll = true,
  allLabel = "All",
  totalDishCount,
  locale = "es",
}: CategoryListProps) {
  // Calculate total dish count if not provided
  const total =
    totalDishCount ?? categories.reduce((sum, c) => sum + (c.dishCount ?? 0), 0);

  if (layout === "tabs") {
    return (
      <div className="flex flex-wrap gap-2">
        {/* All categories button */}
        {showAll && (
          <button
            type="button"
            onClick={() => onCategorySelect(null)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              selectedCategoryId === null
                ? "bg-primary/20 text-primary border border-primary/10"
                : "bg-card-dark text-text-secondary border border-separator hover:bg-hover-row hover:text-text-primary-dark"
            )}
          >
            <span className="material-symbols-outlined text-lg">
              restaurant_menu
            </span>
            <span>{allLabel}</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-xs font-bold",
                selectedCategoryId === null
                  ? "bg-primary/30 text-primary"
                  : "bg-slate-500/10 text-slate-400"
              )}
            >
              {total}
            </span>
          </button>
        )}

        {/* Category buttons */}
        {categories.map((category) => {
          const isSelected = category.id === selectedCategoryId;
          const displayName =
            locale === "en" && category.nameEn ? category.nameEn : category.name;

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onCategorySelect(category.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                isSelected
                  ? "bg-primary/20 text-primary border border-primary/10"
                  : "bg-card-dark text-text-secondary border border-separator hover:bg-hover-row hover:text-text-primary-dark",
                !category.isActive && "opacity-50"
              )}
            >
              <span>{displayName}</span>
              {category.prepSector && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded text-xs font-bold",
                    "bg-surface-dark text-text-muted"
                  )}
                >
                  {category.prepSector.code}
                </span>
              )}
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-bold",
                  isSelected
                    ? "bg-primary/30 text-primary"
                    : "bg-slate-500/10 text-slate-400"
                )}
              >
                {category.dishCount ?? 0}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  // Sidebar layout
  return (
    <div className="space-y-1">
      {/* All categories button */}
      {showAll && (
        <button
          type="button"
          onClick={() => onCategorySelect(null)}
          className={cn(
            "w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors",
            selectedCategoryId === null
              ? "bg-primary/20 text-primary"
              : "text-text-secondary hover:bg-hover-row hover:text-text-primary-dark"
          )}
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-lg">
              restaurant_menu
            </span>
            <span>{allLabel}</span>
          </div>
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-xs font-bold",
              selectedCategoryId === null
                ? "bg-primary/30 text-primary"
                : "bg-slate-500/10 text-slate-400"
            )}
          >
            {total}
          </span>
        </button>
      )}

      {/* Divider */}
      {showAll && categories.length > 0 && (
        <div className="my-2 border-t border-separator" />
      )}

      {/* Category items */}
      {categories.map((category) => {
        const isSelected = category.id === selectedCategoryId;
        const displayName =
          locale === "en" && category.nameEn ? category.nameEn : category.name;

        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onCategorySelect(category.id)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-colors",
              isSelected
                ? "bg-primary/20 text-primary font-medium"
                : "text-text-secondary hover:bg-hover-row hover:text-text-primary-dark",
              !category.isActive && "opacity-50"
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="truncate">{displayName}</span>
              {category.prepSector && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded text-xs font-bold shrink-0",
                    isSelected
                      ? "bg-primary/30 text-primary"
                      : "bg-surface-dark text-text-muted"
                  )}
                >
                  {category.prepSector.code}
                </span>
              )}
            </div>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ml-2",
                isSelected
                  ? "bg-primary/30 text-primary"
                  : "bg-slate-500/10 text-slate-400"
              )}
            >
              {category.dishCount ?? 0}
            </span>
          </button>
        );
      })}

      {/* Empty state */}
      {categories.length === 0 && (
        <div className="px-4 py-6 text-center">
          <span className="material-symbols-outlined text-3xl text-text-muted mb-2">
            category
          </span>
          <p className="text-sm text-text-secondary">No categories yet</p>
        </div>
      )}
    </div>
  );
}

export default CategoryList;
