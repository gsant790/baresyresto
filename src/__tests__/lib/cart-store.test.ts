/**
 * Cart Store Tests
 *
 * Tests the cart state management and calculations including:
 * - Adding/removing items
 * - Quantity updates
 * - Subtotal calculations
 * - VAT calculations (10%)
 * - Tip calculations
 * - SessionStorage persistence
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCart, DEFAULT_VAT_RATE, DEFAULT_TIP_PERCENTAGES } from "@/lib/cart-store";
import { mockSessionStorage } from "../utils/test-helpers";

describe("useCart", () => {
  const tenantSlug = "test-restaurant";
  const tableCode = "ABC123";
  const mockStorage = mockSessionStorage();

  beforeEach(() => {
    global.sessionStorage = mockStorage as any;
    vi.clearAllMocks();
  });

  describe("when initializing cart", () => {
    it("should start with empty cart", () => {
      const { result } = renderHook(() => useCart(tenantSlug, tableCode));

      expect(result.current.items).toEqual([]);
      expect(result.current.itemCount).toBe(0);
      expect(result.current.subtotal).toBe(0);
    });

    it("should load cart from sessionStorage if available", () => {
      const storedCart = [
        {
          dishId: "dish_1",
          name: "Paella",
          price: 15.0,
          quantity: 2,
        },
      ];

      mockStorage.getItem.mockReturnValue(JSON.stringify(storedCart));

      const { result } = renderHook(() => useCart(tenantSlug, tableCode));

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].dishId).toBe("dish_1");
      expect(result.current.itemCount).toBe(2);
    });

    it("should handle corrupted sessionStorage data gracefully", () => {
      mockStorage.getItem.mockReturnValue("invalid json");

      const { result } = renderHook(() => useCart(tenantSlug, tableCode));

      expect(result.current.items).toEqual([]);
    });
  });

  describe("when adding items", () => {
    it("should add a new item to cart", () => {
      const { result } = renderHook(() => useCart(tenantSlug, tableCode));

      act(() => {
        result.current.addItem({
          dishId: "dish_1",
          name: "Paella",
          price: 15.0,
        });
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0]).toMatchObject({
        dishId: "dish_1",
        name: "Paella",
        price: 15.0,
        quantity: 1,
      });
      expect(mockStorage.setItem).toHaveBeenCalled();
    });

    it("should increase quantity if item already exists", () => {
      const { result } = renderHook(() => useCart(tenantSlug, tableCode));

      act(() => {
        result.current.addItem({
          dishId: "dish_1",
          name: "Paella",
          price: 15.0,
        });
      });

      act(() => {
        result.current.addItem({
          dishId: "dish_1",
          name: "Paella",
          price: 15.0,
        });
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].quantity).toBe(2);
    });

    it("should add multiple items of different dishes", () => {
      const { result } = renderHook(() => useCart(tenantSlug, tableCode));

      act(() => {
        result.current.addItem({
          dishId: "dish_1",
          name: "Paella",
          price: 15.0,
        });
        result.current.addItem({
          dishId: "dish_2",
          name: "Tapas",
          price: 8.5,
        });
      });

      expect(result.current.items).toHaveLength(2);
      expect(result.current.itemCount).toBe(2);
    });

    it("should add item with custom quantity", () => {
      const { result } = renderHook(() => useCart(tenantSlug, tableCode));

      act(() => {
        result.current.addItem({
          dishId: "dish_1",
          name: "Paella",
          price: 15.0,
          quantity: 3,
        });
      });

      expect(result.current.items[0].quantity).toBe(3);
      expect(result.current.itemCount).toBe(3);
    });

    it("should preserve notes when adding items", () => {
      const { result } = renderHook(() => useCart(tenantSlug, tableCode));

      act(() => {
        result.current.addItem({
          dishId: "dish_1",
          name: "Paella",
          price: 15.0,
          notes: "No seafood",
        });
      });

      expect(result.current.items[0].notes).toBe("No seafood");
    });
  });

  describe("when removing items", () => {
    it("should remove an item from cart", () => {
      const { result } = renderHook(() => useCart(tenantSlug, tableCode));

      act(() => {
        result.current.addItem({
          dishId: "dish_1",
          name: "Paella",
          price: 15.0,
        });
      });

      act(() => {
        result.current.removeItem("dish_1");
      });

      expect(result.current.items).toHaveLength(0);
      expect(mockStorage.removeItem).toHaveBeenCalled();
    });

    it("should not error when removing non-existent item", () => {
      const { result } = renderHook(() => useCart(tenantSlug, tableCode));

      act(() => {
        result.current.removeItem("non_existent");
      });

      expect(result.current.items).toHaveLength(0);
    });
  });

  describe("when updating quantity", () => {
    it("should update item quantity", () => {
      const { result } = renderHook(() => useCart(tenantSlug, tableCode));

      act(() => {
        result.current.addItem({
          dishId: "dish_1",
          name: "Paella",
          price: 15.0,
        });
      });

      act(() => {
        result.current.updateQuantity("dish_1", 5);
      });

      expect(result.current.items[0].quantity).toBe(5);
      expect(result.current.itemCount).toBe(5);
    });

    it("should remove item when quantity is 0", () => {
      const { result } = renderHook(() => useCart(tenantSlug, tableCode));

      act(() => {
        result.current.addItem({
          dishId: "dish_1",
          name: "Paella",
          price: 15.0,
        });
      });

      act(() => {
        result.current.updateQuantity("dish_1", 0);
      });

      expect(result.current.items).toHaveLength(0);
    });

    it("should remove item when quantity is negative", () => {
      const { result } = renderHook(() => useCart(tenantSlug, tableCode));

      act(() => {
        result.current.addItem({
          dishId: "dish_1",
          name: "Paella",
          price: 15.0,
        });
      });

      act(() => {
        result.current.updateQuantity("dish_1", -1);
      });

      expect(result.current.items).toHaveLength(0);
    });
  });

  describe("when updating notes", () => {
    it("should update item notes", () => {
      const { result } = renderHook(() => useCart(tenantSlug, tableCode));

      act(() => {
        result.current.addItem({
          dishId: "dish_1",
          name: "Paella",
          price: 15.0,
        });
      });

      act(() => {
        result.current.updateNotes("dish_1", "Extra spicy");
      });

      expect(result.current.items[0].notes).toBe("Extra spicy");
    });
  });

  describe("when clearing cart", () => {
    it("should remove all items", () => {
      const { result } = renderHook(() => useCart(tenantSlug, tableCode));

      act(() => {
        result.current.addItem({
          dishId: "dish_1",
          name: "Paella",
          price: 15.0,
        });
        result.current.addItem({
          dishId: "dish_2",
          name: "Tapas",
          price: 8.5,
        });
      });

      act(() => {
        result.current.clearCart();
      });

      expect(result.current.items).toHaveLength(0);
      expect(result.current.itemCount).toBe(0);
    });
  });

  describe("when calculating totals", () => {
    it("should calculate subtotal correctly", () => {
      const { result } = renderHook(() => useCart(tenantSlug, tableCode));

      act(() => {
        result.current.addItem({
          dishId: "dish_1",
          name: "Paella",
          price: 15.0,
          quantity: 2,
        });
        result.current.addItem({
          dishId: "dish_2",
          name: "Tapas",
          price: 8.5,
          quantity: 1,
        });
      });

      // 15 * 2 + 8.5 * 1 = 38.5
      expect(result.current.subtotal).toBe(38.5);
    });

    it("should calculate VAT at 10% by default", () => {
      const { result } = renderHook(() => useCart(tenantSlug, tableCode));

      act(() => {
        result.current.addItem({
          dishId: "dish_1",
          name: "Paella",
          price: 100.0,
        });
      });

      // 100 * 0.10 = 10
      expect(result.current.vatAmount).toBe(10.0);
    });

    it("should calculate VAT with custom rate", () => {
      const customVatRate = 21;
      const { result } = renderHook(() =>
        useCart(tenantSlug, tableCode, customVatRate)
      );

      act(() => {
        result.current.addItem({
          dishId: "dish_1",
          name: "Paella",
          price: 100.0,
        });
      });

      // 100 * 0.21 = 21
      expect(result.current.vatAmount).toBe(21.0);
    });

    it("should calculate total with no tip", () => {
      const { result } = renderHook(() => useCart(tenantSlug, tableCode));

      act(() => {
        result.current.addItem({
          dishId: "dish_1",
          name: "Paella",
          price: 100.0,
        });
      });

      // subtotal: 100, vat: 10, tip: 0 = 110
      const total = result.current.calculateTotal(0);
      expect(total).toBe(110.0);
    });

    it("should calculate total with 10% tip", () => {
      const { result } = renderHook(() => useCart(tenantSlug, tableCode));

      act(() => {
        result.current.addItem({
          dishId: "dish_1",
          name: "Paella",
          price: 100.0,
        });
      });

      // subtotal: 100, vat: 10, tip: 10 = 120
      const total = result.current.calculateTotal(10);
      expect(total).toBe(120.0);
    });

    it("should calculate tip amount correctly", () => {
      const { result } = renderHook(() => useCart(tenantSlug, tableCode));

      act(() => {
        result.current.addItem({
          dishId: "dish_1",
          name: "Paella",
          price: 100.0,
        });
      });

      const tip5 = result.current.calculateTip(5);
      expect(tip5).toBe(5.0);

      const tip15 = result.current.calculateTip(15);
      expect(tip15).toBe(15.0);
    });

    it("should calculate itemCount correctly", () => {
      const { result } = renderHook(() => useCart(tenantSlug, tableCode));

      act(() => {
        result.current.addItem({
          dishId: "dish_1",
          name: "Paella",
          price: 15.0,
          quantity: 3,
        });
        result.current.addItem({
          dishId: "dish_2",
          name: "Tapas",
          price: 8.5,
          quantity: 2,
        });
      });

      // 3 + 2 = 5
      expect(result.current.itemCount).toBe(5);
    });
  });

  describe("when checking cart utilities", () => {
    it("should check if item is in cart", () => {
      const { result } = renderHook(() => useCart(tenantSlug, tableCode));

      act(() => {
        result.current.addItem({
          dishId: "dish_1",
          name: "Paella",
          price: 15.0,
        });
      });

      expect(result.current.isInCart("dish_1")).toBe(true);
      expect(result.current.isInCart("dish_2")).toBe(false);
    });

    it("should get item by dishId", () => {
      const { result } = renderHook(() => useCart(tenantSlug, tableCode));

      act(() => {
        result.current.addItem({
          dishId: "dish_1",
          name: "Paella",
          price: 15.0,
          quantity: 3,
        });
      });

      const item = result.current.getItem("dish_1");
      expect(item).toBeDefined();
      expect(item?.quantity).toBe(3);
    });

    it("should get quantity for dish", () => {
      const { result } = renderHook(() => useCart(tenantSlug, tableCode));

      act(() => {
        result.current.addItem({
          dishId: "dish_1",
          name: "Paella",
          price: 15.0,
          quantity: 5,
        });
      });

      expect(result.current.getQuantity("dish_1")).toBe(5);
      expect(result.current.getQuantity("dish_2")).toBe(0);
    });
  });

  describe("edge cases", () => {
    it("should handle decimal prices correctly", () => {
      const { result } = renderHook(() => useCart(tenantSlug, tableCode));

      act(() => {
        result.current.addItem({
          dishId: "dish_1",
          name: "Tapas",
          price: 8.95,
          quantity: 3,
        });
      });

      // 8.95 * 3 = 26.85
      expect(result.current.subtotal).toBeCloseTo(26.85);
    });

    it("should handle empty cart calculations", () => {
      const { result } = renderHook(() => useCart(tenantSlug, tableCode));

      expect(result.current.subtotal).toBe(0);
      expect(result.current.vatAmount).toBe(0);
      expect(result.current.calculateTotal(10)).toBe(0);
    });

    it("should persist cart across multiple table codes", () => {
      const { result: cart1 } = renderHook(() => useCart(tenantSlug, "TABLE1"));
      const { result: cart2 } = renderHook(() => useCart(tenantSlug, "TABLE2"));

      act(() => {
        cart1.current.addItem({
          dishId: "dish_1",
          name: "Paella",
          price: 15.0,
        });
      });

      act(() => {
        cart2.current.addItem({
          dishId: "dish_2",
          name: "Tapas",
          price: 8.5,
        });
      });

      expect(cart1.current.items).toHaveLength(1);
      expect(cart2.current.items).toHaveLength(1);
      expect(cart1.current.items[0].dishId).toBe("dish_1");
      expect(cart2.current.items[0].dishId).toBe("dish_2");
    });
  });
});
