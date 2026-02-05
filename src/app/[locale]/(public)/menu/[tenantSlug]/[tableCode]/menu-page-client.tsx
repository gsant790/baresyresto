"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn, formatCurrency } from "@/lib/utils";
import { useCart } from "@/lib/cart-store";
import { api } from "@/lib/trpc/client";
import {
  CategoryTabs,
  MenuGrid,
  CartSheet,
  OrderConfirmation,
} from "@/components/features/ordering";

/**
 * MenuPageClient Component
 *
 * Client-side component for the customer menu page.
 * Handles cart state, category filtering, and order submission.
 */

// Type definitions for props
interface Category {
  id: string;
  name: string;
  nameEn?: string | null;
  displayOrder: number;
}

interface Dish {
  id: string;
  name: string;
  nameEn?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  price: number;
  imageUrl?: string | null;
  allergens: string[];
  displayOrder: number;
  category: {
    id: string;
    name: string;
    nameEn?: string | null;
    displayOrder?: number;
  };
}

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
}

interface TableInfo {
  id: string;
  number: number;
  name?: string | null;
}

interface Settings {
  vatRate: number;
  tipEnabled: boolean;
  tipPercentages: number[];
  currency: string;
}

interface MenuPageClientProps {
  tenant: TenantInfo;
  table: TableInfo;
  tableCode: string;
  categories: Category[];
  dishes: Dish[];
  settings: Settings;
  locale: string;
}

// View states for the page
type ViewState = "menu" | "confirmation";

export function MenuPageClient({
  tenant,
  table,
  tableCode,
  categories,
  dishes,
  settings,
  locale,
}: MenuPageClientProps) {
  const router = useRouter();

  // State management
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [viewState, setViewState] = useState<ViewState>("menu");
  const [orderResult, setOrderResult] = useState<{
    orderNumber: number;
    total: number;
  } | null>(null);

  // Cart hook
  const cart = useCart(tenant.slug, tableCode, settings.vatRate);

  // Order mutation
  const createOrder = api.orders.createOrder.useMutation({
    onSuccess: (data) => {
      // Store order result and show confirmation
      setOrderResult({
        orderNumber: data.order.orderNumber,
        total: data.order.total,
      });
      setViewState("confirmation");
      setIsCartOpen(false);
      // Clear the cart after successful order
      cart.clearCart();
    },
    onError: (error) => {
      // Show error to user
      alert(
        locale === "en"
          ? `Error placing order: ${error.message}`
          : `Error al realizar el pedido: ${error.message}`
      );
    },
  });

  // Get table display name
  const tableDisplay =
    table.name || (locale === "en" ? `Table ${table.number}` : `Mesa ${table.number}`);

  // Translation strings
  const t = {
    all: locale === "en" ? "All" : "Todo",
    viewCart: locale === "en" ? "View Cart" : "Ver Carrito",
    items: locale === "en" ? "items" : "items",
    item: locale === "en" ? "item" : "item",
    emptyCart: locale === "en" ? "Your cart is empty" : "Tu carrito esta vacio",
    browseMenu:
      locale === "en" ? "Browse the menu to add items" : "Explora el menu para agregar items",
  };

  // Handle checkout from cart sheet
  const handleCheckout = (tipPercentage: number, customerNotes: string) => {
    // Prepare order items
    const items = cart.items.map((item) => ({
      dishId: item.dishId,
      quantity: item.quantity,
      notes: item.notes,
    }));

    // Submit order
    createOrder.mutate({
      tenantSlug: tenant.slug,
      tableCode: tableCode,
      items,
      customerNotes: customerNotes || undefined,
      tipPercentage: tipPercentage > 0 ? tipPercentage : undefined,
    });
  };

  // Handle view order status
  const handleViewStatus = () => {
    if (orderResult) {
      router.push(
        `/${locale}/menu/${tenant.slug}/${tableCode}/order/${orderResult.orderNumber}`
      );
    }
  };

  // Handle new order (return to menu)
  const handleNewOrder = () => {
    setOrderResult(null);
    setViewState("menu");
  };

  // Show confirmation screen if order was placed
  if (viewState === "confirmation" && orderResult) {
    return (
      <div className="flex min-h-screen flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-surface-dark border-b border-separator px-4 py-4">
          <div className="mx-auto max-w-md">
            <h1 className="text-xl font-bold text-text-primary-dark">
              {tenant.name}
            </h1>
            <p className="text-sm text-text-secondary">{tableDisplay}</p>
          </div>
        </header>

        {/* Confirmation content */}
        <div className="flex-1 px-4 py-6">
          <div className="mx-auto max-w-md">
            <OrderConfirmation
              orderNumber={orderResult.orderNumber}
              total={orderResult.total}
              tableName={table.name}
              tableNumber={table.number}
              onViewStatus={handleViewStatus}
              onNewOrder={handleNewOrder}
              locale={locale}
              currency={settings.currency}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header with restaurant branding */}
      <header className="sticky top-0 z-20 bg-surface-dark border-b border-separator">
        <div className="px-4 py-4">
          <div className="mx-auto max-w-md">
            <div className="flex items-center gap-3">
              {/* Logo placeholder */}
              {tenant.logoUrl ? (
                <img
                  src={tenant.logoUrl}
                  alt={tenant.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">
                    restaurant
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold text-text-primary-dark">
                  {tenant.name}
                </h1>
                <p className="text-sm text-text-secondary">{tableDisplay}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Category tabs */}
        <div className="bg-background-dark">
          <div className="mx-auto max-w-md">
            <CategoryTabs
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
              locale={locale}
              allLabel={t.all}
            />
          </div>
        </div>
      </header>

      {/* Menu content area */}
      <div className="flex-1 px-4 py-6 pb-24">
        <div className="mx-auto max-w-md">
          <MenuGrid
            dishes={dishes}
            selectedCategoryId={selectedCategoryId}
            cart={cart}
            locale={locale}
            currency={settings.currency}
          />
        </div>
      </div>

      {/* Fixed bottom cart bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-surface-dark border-t border-separator p-4 shadow-lg shadow-black/40">
        <div className="mx-auto max-w-md">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            disabled={cart.itemCount === 0}
            className={cn(
              "w-full rounded-xl h-14 font-bold transition-all duration-200",
              "shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              cart.itemCount > 0
                ? "bg-primary hover:bg-primary-dark text-white shadow-primary/20"
                : "bg-card-dark text-text-muted cursor-not-allowed border border-separator"
            )}
          >
            {cart.itemCount > 0 ? (
              <span className="flex items-center justify-between px-4">
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined">shopping_cart</span>
                  {t.viewCart} ({cart.itemCount} {cart.itemCount === 1 ? t.item : t.items})
                </span>
                <span>
                  {formatCurrency(
                    cart.calculateTotal(0),
                    settings.currency,
                    locale === "en" ? "en-GB" : "es-ES"
                  )}
                </span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">shopping_cart</span>
                {t.emptyCart}
              </span>
            )}
          </button>
        </div>
      </footer>

      {/* Cart sheet */}
      <CartSheet
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onCheckout={handleCheckout}
        isSubmitting={createOrder.isPending}
        locale={locale}
        currency={settings.currency}
        tipPercentages={settings.tipPercentages}
        tipEnabled={settings.tipEnabled}
      />
    </div>
  );
}

export default MenuPageClient;
