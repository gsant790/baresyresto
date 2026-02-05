"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { DishCard, type DishData } from "./dish-card";

/**
 * DishGrid Component
 *
 * Displays a grid of dish cards grouped by category.
 * Supports filtering by category and search term.
 * Shows empty state when no dishes match the filters.
 */

interface DishGridProps {
  dishes: DishData[];
  selectedCategoryId?: string | null;
  searchQuery?: string;
  onDishClick?: (dish: DishData) => void;
  onToggleAvailable?: (id: string, isAvailable: boolean) => void;
  selectedDishId?: string;
  togglingDishId?: string;
  locale?: string;
}

export function DishGrid({
  dishes,
  selectedCategoryId,
  searchQuery,
  onDishClick,
  onToggleAvailable,
  selectedDishId,
  togglingDishId,
  locale = "es",
}: DishGridProps) {
  // Filter dishes by category and search
  const filteredDishes = useMemo(() => {
    let result = dishes;

    // Filter by category
    if (selectedCategoryId) {
      result = result.filter((dish) => dish.category.id === selectedCategoryId);
    }

    // Filter by search query
    if (searchQuery?.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (dish) =>
          dish.name.toLowerCase().includes(query) ||
          dish.nameEn?.toLowerCase().includes(query) ||
          dish.description?.toLowerCase().includes(query) ||
          dish.descriptionEn?.toLowerCase().includes(query) ||
          dish.category.name.toLowerCase().includes(query)
      );
    }

    return result;
  }, [dishes, selectedCategoryId, searchQuery]);

  // Group dishes by category
  const dishesByCategory = useMemo(() => {
    const grouped: Record<string, { name: string; dishes: DishData[] }> = {};

    filteredDishes.forEach((dish) => {
      const categoryId = dish.category.id;
      if (!grouped[categoryId]) {
        grouped[categoryId] = {
          name: dish.category.name,
          dishes: [],
        };
      }
      grouped[categoryId].dishes.push(dish);
    });

    // Sort dishes within each category by displayOrder
    Object.values(grouped).forEach((category) => {
      category.dishes.sort((a, b) => a.displayOrder - b.displayOrder);
    });

    return grouped;
  }, [filteredDishes]);

  // Get sorted category IDs (to maintain consistent ordering)
  const categoryIds = Object.keys(dishesByCategory);

  // Empty state
  if (filteredDishes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <span className="material-symbols-outlined text-5xl text-text-muted mb-4">
          restaurant_menu
        </span>
        <p className="text-text-secondary">
          {searchQuery
            ? `No dishes found for "${searchQuery}"`
            : selectedCategoryId
            ? "No dishes in this category"
            : "No dishes found. Add your first dish to get started."}
        </p>
      </div>
    );
  }

  // If filtering by category, show flat grid
  if (selectedCategoryId) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredDishes.map((dish) => (
          <DishCard
            key={dish.id}
            dish={dish}
            onClick={() => onDishClick?.(dish)}
            onToggleAvailable={onToggleAvailable}
            selected={dish.id === selectedDishId}
            isToggling={dish.id === togglingDishId}
            locale={locale}
          />
        ))}
      </div>
    );
  }

  // Show dishes grouped by category
  return (
    <div className="space-y-8">
      {categoryIds.map((categoryId) => {
        const category = dishesByCategory[categoryId];
        return (
          <div key={categoryId}>
            {/* Category header */}
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-lg font-bold text-text-primary-dark">
                {category.name}
              </h3>
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-bold",
                  "bg-primary/10 text-primary"
                )}
              >
                {category.dishes.length}
              </span>
            </div>

            {/* Dishes grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {category.dishes.map((dish) => (
                <DishCard
                  key={dish.id}
                  dish={dish}
                  onClick={() => onDishClick?.(dish)}
                  onToggleAvailable={onToggleAvailable}
                  selected={dish.id === selectedDishId}
                  isToggling={dish.id === togglingDishId}
                  locale={locale}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default DishGrid;
