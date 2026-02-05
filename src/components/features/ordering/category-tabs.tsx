"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * CategoryTabs Component
 *
 * Horizontal scrollable tabs for filtering menu items by category.
 * Shows an "All" option plus all active categories.
 * Scrolls the active tab into view when it changes.
 */

export interface Category {
  id: string;
  name: string;
  nameEn?: string | null;
}

interface CategoryTabsProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  locale?: string;
  allLabel?: string;
}

export function CategoryTabs({
  categories,
  selectedCategoryId,
  onSelectCategory,
  locale = "es",
  allLabel = "Todo",
}: CategoryTabsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedTabRef = useRef<HTMLButtonElement>(null);

  // Scroll selected tab into view when selection changes
  useEffect(() => {
    if (selectedTabRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const tab = selectedTabRef.current;

      const containerRect = container.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();

      // Calculate if tab is outside visible area
      const isOutsideLeft = tabRect.left < containerRect.left;
      const isOutsideRight = tabRect.right > containerRect.right;

      if (isOutsideLeft || isOutsideRight) {
        tab.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [selectedCategoryId]);

  /**
   * Get display name based on locale
   */
  const getDisplayName = (category: Category): string => {
    if (locale === "en" && category.nameEn) {
      return category.nameEn;
    }
    return category.name;
  };

  return (
    <div
      ref={scrollContainerRef}
      className={cn(
        "flex gap-2 overflow-x-auto py-2 px-4",
        "scrollbar-hide -mx-4",
        // Hide scrollbar on all browsers
        "[&::-webkit-scrollbar]:hidden",
        "[-ms-overflow-style:none]",
        "[scrollbar-width:none]"
      )}
      role="tablist"
      aria-label="Category filter"
    >
      {/* "All" tab */}
      <button
        ref={selectedCategoryId === null ? selectedTabRef : undefined}
        type="button"
        role="tab"
        aria-selected={selectedCategoryId === null}
        onClick={() => onSelectCategory(null)}
        className={cn(
          "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium",
          "transition-all duration-200",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          selectedCategoryId === null
            ? "bg-primary text-white shadow-lg shadow-primary/30"
            : "bg-card-dark text-text-secondary hover:bg-surface-dark hover:text-text-primary-dark"
        )}
      >
        {allLabel}
      </button>

      {/* Category tabs */}
      {categories.map((category) => {
        const isSelected = selectedCategoryId === category.id;

        return (
          <button
            key={category.id}
            ref={isSelected ? selectedTabRef : undefined}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelectCategory(category.id)}
            className={cn(
              "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium",
              "transition-all duration-200",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              isSelected
                ? "bg-primary text-white shadow-lg shadow-primary/30"
                : "bg-card-dark text-text-secondary hover:bg-surface-dark hover:text-text-primary-dark"
            )}
          >
            {getDisplayName(category)}
          </button>
        );
      })}
    </div>
  );
}

export default CategoryTabs;
