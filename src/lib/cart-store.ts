"use client";

/**
 * Cart Store
 *
 * Zustand-style state management for the customer ordering cart.
 * Persists cart data to sessionStorage keyed by tableCode.
 *
 * Note: This implementation uses React's useState + useEffect pattern
 * with sessionStorage for persistence, providing similar functionality
 * to Zustand without adding another dependency.
 */

import { useState, useEffect, useCallback, useMemo } from "react";

/**
 * Represents a single item in the cart
 */
export interface CartItem {
  dishId: string;
  name: string;
  nameEn?: string | null;
  price: number;
  quantity: number;
  notes?: string;
  imageUrl?: string | null;
}

/**
 * Cart state interface
 */
export interface CartState {
  items: CartItem[];
  tableCode: string;
  tenantSlug: string;
}

/**
 * Default VAT rate for Spain (10%)
 */
export const DEFAULT_VAT_RATE = 10;

/**
 * Default tip percentages offered to customers
 */
export const DEFAULT_TIP_PERCENTAGES = [0, 5, 10, 15];

/**
 * Generate a unique storage key for the cart
 */
function getStorageKey(tenantSlug: string, tableCode: string): string {
  return `cart:${tenantSlug}:${tableCode}`;
}

/**
 * Load cart from sessionStorage
 */
function loadCart(
  tenantSlug: string,
  tableCode: string
): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const key = getStorageKey(tenantSlug, tableCode);
    const stored = sessionStorage.getItem(key);
    if (stored) {
      const data = JSON.parse(stored);
      // Validate the data structure
      if (Array.isArray(data)) {
        return data.filter(
          (item): item is CartItem =>
            typeof item === "object" &&
            typeof item.dishId === "string" &&
            typeof item.name === "string" &&
            typeof item.price === "number" &&
            typeof item.quantity === "number"
        );
      }
    }
  } catch (error) {
    console.error("Failed to load cart from storage:", error);
  }

  return [];
}

/**
 * Save cart to sessionStorage
 */
function saveCart(
  tenantSlug: string,
  tableCode: string,
  items: CartItem[]
): void {
  if (typeof window === "undefined") return;

  try {
    const key = getStorageKey(tenantSlug, tableCode);
    if (items.length === 0) {
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, JSON.stringify(items));
    }
  } catch (error) {
    console.error("Failed to save cart to storage:", error);
  }
}

/**
 * Custom hook for cart state management
 *
 * @param tenantSlug - The restaurant's unique slug
 * @param tableCode - The table's QR code
 * @param vatRate - VAT rate as percentage (default 10%)
 *
 * @example
 * const { items, addItem, removeItem, total } = useCart("la-tasca", "ABC123");
 */
export function useCart(
  tenantSlug: string,
  tableCode: string,
  vatRate: number = DEFAULT_VAT_RATE
) {
  // Initialize state from sessionStorage
  const [items, setItems] = useState<CartItem[]>(() =>
    loadCart(tenantSlug, tableCode)
  );

  // Persist to sessionStorage on changes
  useEffect(() => {
    saveCart(tenantSlug, tableCode, items);
  }, [tenantSlug, tableCode, items]);

  /**
   * Add an item to the cart or increase quantity if it exists
   */
  const addItem = useCallback(
    (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
      setItems((current) => {
        const existingIndex = current.findIndex(
          (i) => i.dishId === item.dishId
        );

        if (existingIndex >= 0) {
          // Update existing item quantity
          const updated = [...current];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity:
              updated[existingIndex].quantity + (item.quantity ?? 1),
          };
          return updated;
        }

        // Add new item
        return [
          ...current,
          {
            dishId: item.dishId,
            name: item.name,
            nameEn: item.nameEn,
            price: item.price,
            quantity: item.quantity ?? 1,
            notes: item.notes,
            imageUrl: item.imageUrl,
          },
        ];
      });
    },
    []
  );

  /**
   * Remove an item from the cart completely
   */
  const removeItem = useCallback((dishId: string) => {
    setItems((current) => current.filter((item) => item.dishId !== dishId));
  }, []);

  /**
   * Update the quantity of an item
   * Removes the item if quantity is 0 or less
   */
  const updateQuantity = useCallback((dishId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((current) => current.filter((item) => item.dishId !== dishId));
    } else {
      setItems((current) =>
        current.map((item) =>
          item.dishId === dishId ? { ...item, quantity } : item
        )
      );
    }
  }, []);

  /**
   * Update notes for an item
   */
  const updateNotes = useCallback((dishId: string, notes: string) => {
    setItems((current) =>
      current.map((item) =>
        item.dishId === dishId ? { ...item, notes } : item
      )
    );
  }, []);

  /**
   * Clear all items from the cart
   */
  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  /**
   * Calculate totals
   */
  const calculations = useMemo(() => {
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const vatAmount = subtotal * (vatRate / 100);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      subtotal,
      vatAmount,
      itemCount,
    };
  }, [items, vatRate]);

  /**
   * Calculate total with optional tip
   */
  const calculateTotal = useCallback(
    (tipPercentage: number = 0) => {
      const tipAmount = calculations.subtotal * (tipPercentage / 100);
      return calculations.subtotal + calculations.vatAmount + tipAmount;
    },
    [calculations.subtotal, calculations.vatAmount]
  );

  /**
   * Calculate tip amount for a given percentage
   */
  const calculateTip = useCallback(
    (tipPercentage: number) => {
      return calculations.subtotal * (tipPercentage / 100);
    },
    [calculations.subtotal]
  );

  /**
   * Get item by dish ID
   */
  const getItem = useCallback(
    (dishId: string) => {
      return items.find((item) => item.dishId === dishId);
    },
    [items]
  );

  /**
   * Check if dish is in cart
   */
  const isInCart = useCallback(
    (dishId: string) => {
      return items.some((item) => item.dishId === dishId);
    },
    [items]
  );

  /**
   * Get quantity of a dish in cart
   */
  const getQuantity = useCallback(
    (dishId: string) => {
      const item = items.find((i) => i.dishId === dishId);
      return item?.quantity ?? 0;
    },
    [items]
  );

  return {
    // State
    items,
    itemCount: calculations.itemCount,
    subtotal: calculations.subtotal,
    vatAmount: calculations.vatAmount,
    vatRate,

    // Actions
    addItem,
    removeItem,
    updateQuantity,
    updateNotes,
    clearCart,

    // Calculations
    calculateTotal,
    calculateTip,

    // Utilities
    getItem,
    isInCart,
    getQuantity,
  };
}

export type CartStore = ReturnType<typeof useCart>;
