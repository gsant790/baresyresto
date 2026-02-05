"use client";

import { useMemo } from "react";
import { MenuItemCard, type MenuItemData } from "./menu-item-card";
import type { CartStore } from "@/lib/cart-store";

/**
 * MenuGrid Component
 *
 * Displays a grid of menu items filtered by category.
 * Groups items by category when showing all categories.
 * Integrates with the cart store for quantity display and actions.
 */

interface MenuDish extends MenuItemData {
  category: {
    id: string;
    name: string;
    nameEn?: string | null;
  };
}

interface MenuGridProps {
  dishes: MenuDish[];
  selectedCategoryId: string | null;
  cart: CartStore;
  locale?: string;
  currency?: string;
  emptyMessage?: string;
}

export function MenuGrid({
  dishes,
  selectedCategoryId,
  cart,
  locale = "es",
  currency = "EUR",
  emptyMessage,
}: MenuGridProps) {
  // Filter and group dishes by category
  const groupedDishes = useMemo(() => {
    // Filter by category if selected
    const filtered = selectedCategoryId
      ? dishes.filter((dish) => dish.category.id === selectedCategoryId)
      : dishes;

    // Group by category
    const groups = new Map<
      string,
      { category: { id: string; name: string; nameEn?: string | null }; items: MenuDish[] }
    >();

    for (const dish of filtered) {
      const categoryId = dish.category.id;
      if (!groups.has(categoryId)) {
        groups.set(categoryId, {
          category: dish.category,
          items: [],
        });
      }
      groups.get(categoryId)!.items.push(dish);
    }

    return Array.from(groups.values());
  }, [dishes, selectedCategoryId]);

  // Get category display name
  const getCategoryName = (category: { name: string; nameEn?: string | null }): string => {
    return locale === "en" && category.nameEn ? category.nameEn : category.name;
  };

  // Default empty message
  const defaultEmptyMessage =
    locale === "en" ? "No dishes available" : "No hay platos disponibles";

  // Show empty state if no dishes
  if (groupedDishes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <span className="material-symbols-outlined text-5xl text-text-muted mb-3">
          restaurant_menu
        </span>
        <p className="text-text-secondary text-center">
          {emptyMessage || defaultEmptyMessage}
        </p>
      </div>
    );
  }

  // Handle add to cart
  const handleAddItem = (dish: MenuDish) => {
    cart.addItem({
      dishId: dish.id,
      name: dish.name,
      nameEn: dish.nameEn,
      price: dish.price,
      imageUrl: dish.imageUrl,
    });
  };

  // Handle remove from cart
  const handleRemoveItem = (dishId: string) => {
    const currentQuantity = cart.getQuantity(dishId);
    cart.updateQuantity(dishId, currentQuantity - 1);
  };

  return (
    <div className="space-y-6">
      {groupedDishes.map((group) => (
        <section key={group.category.id}>
          {/* Category header - only show when not filtered */}
          {!selectedCategoryId && (
            <h2 className="text-lg font-bold text-text-primary-dark mb-3 px-1">
              {getCategoryName(group.category)}
            </h2>
          )}

          {/* Dishes grid */}
          <div className="space-y-3">
            {group.items.map((dish) => (
              <MenuItemCard
                key={dish.id}
                item={dish}
                quantity={cart.getQuantity(dish.id)}
                onAdd={() => handleAddItem(dish)}
                onRemove={() => handleRemoveItem(dish.id)}
                locale={locale}
                currency={currency}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default MenuGrid;
