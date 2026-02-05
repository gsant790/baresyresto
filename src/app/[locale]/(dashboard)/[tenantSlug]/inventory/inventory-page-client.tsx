"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Product, Unit } from "@prisma/client";
import { cn } from "@/lib/utils";
import { api } from "@/lib/trpc/client";
import {
  InventoryTable,
  LowStockAlert,
  ProductForm,
  type ProductWithStatus,
  type StockStatus,
  type ProductFormData,
  type LowStockProduct,
} from "@/components/features/inventory";

/**
 * InventoryPageClient Component
 *
 * Client-side inventory management interface.
 * Handles creating, editing, and deleting products, viewing stock alerts,
 * and adjusting quantities.
 */

interface InventoryPageClientProps {
  initialProducts: ProductWithStatus[];
  stats: {
    total: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
  };
  lowStockProducts: LowStockProduct[];
  tenantSlug: string;
  locale: string;
  translations: {
    title: string;
    addProduct: string;
    products: string;
    quantity: string;
    unit: string;
    alertThreshold: string;
    lowStock: string;
    search: string;
    noResults: string;
  };
}

type ModalState =
  | { type: "none" }
  | { type: "create" }
  | { type: "edit"; product: ProductWithStatus }
  | { type: "delete"; product: ProductWithStatus }
  | { type: "adjust"; product: ProductWithStatus };

export function InventoryPageClient({
  initialProducts,
  stats: initialStats,
  lowStockProducts: initialLowStock,
  tenantSlug,
  locale,
  translations: t,
}: InventoryPageClientProps) {
  const router = useRouter();
  const [modalState, setModalState] = useState<ModalState>({ type: "none" });
  const [adjustmentValue, setAdjustmentValue] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");

  // Use tRPC query with initial data
  const {
    data: productsData,
    refetch,
    isLoading,
  } = api.inventory.list.useQuery(undefined, {
    initialData: { products: initialProducts, nextCursor: undefined },
  });

  // Get low stock products query - no initialData needed, will fetch from API
  const { data: lowStockData } = api.inventory.getLowStock.useQuery(
    { limit: 10 }
  );

  // Get stats query
  const { data: statsData } = api.inventory.getStats.useQuery(undefined, {
    initialData: initialStats,
  });

  const products = productsData?.products ?? initialProducts;
  const stats = statsData ?? initialStats;

  // Convert low stock data to the expected format
  const lowStockProducts: LowStockProduct[] = useMemo(() => {
    if (!lowStockData) return initialLowStock;
    return lowStockData.map((p) => ({
      id: p.id,
      name: p.name,
      quantity: Number(p.quantity),
      alertThreshold: Number(p.alertThreshold),
      unit: p.unit,
    }));
  }, [lowStockData, initialLowStock]);

  // Create product mutation
  const createMutation = api.inventory.create.useMutation({
    onSuccess: () => {
      setModalState({ type: "none" });
      refetch();
    },
  });

  // Update product mutation
  const updateMutation = api.inventory.update.useMutation({
    onSuccess: () => {
      setModalState({ type: "none" });
      refetch();
    },
  });

  // Delete product mutation
  const deleteMutation = api.inventory.delete.useMutation({
    onSuccess: () => {
      setModalState({ type: "none" });
      refetch();
    },
  });

  // Adjust quantity mutation
  const adjustMutation = api.inventory.adjustQuantity.useMutation({
    onSuccess: () => {
      setModalState({ type: "none" });
      setAdjustmentValue("");
      setAdjustmentReason("");
      refetch();
    },
  });

  const handleProductClick = (product: ProductWithStatus) => {
    router.push(`/${locale}/${tenantSlug}/inventory/${product.id}`);
  };

  const handleCreateSubmit = (data: ProductFormData) => {
    createMutation.mutate(data);
  };

  const handleEditSubmit = (data: ProductFormData) => {
    if (modalState.type !== "edit") return;
    updateMutation.mutate({
      id: modalState.product.id,
      ...data,
    });
  };

  const handleDelete = () => {
    if (modalState.type !== "delete") return;
    deleteMutation.mutate({ id: modalState.product.id });
  };

  const handleAdjustQuantity = () => {
    if (modalState.type !== "adjust") return;
    const adjustment = parseFloat(adjustmentValue);
    if (isNaN(adjustment) || adjustment === 0) return;

    adjustMutation.mutate({
      id: modalState.product.id,
      adjustment,
      reason: adjustmentReason || undefined,
    });
  };

  const handleLowStockViewAll = () => {
    // The InventoryTable has its own filter - we just focus user attention
    // Could scroll to table or apply filter
  };

  const handleLowStockProductClick = (product: LowStockProduct) => {
    router.push(`/${locale}/${tenantSlug}/inventory/${product.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary-dark tracking-tight">
            {t.title}
          </h1>
          <p className="text-text-secondary mt-1">
            {stats.total} {t.products.toLowerCase()},{" "}
            {stats.inStock} in stock
          </p>
        </div>

        {/* Add product button */}
        <button
          type="button"
          onClick={() => setModalState({ type: "create" })}
          className={cn(
            "flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm",
            "bg-primary text-white",
            "hover:bg-primary-dark",
            "shadow-lg shadow-primary/20"
          )}
        >
          <span className="material-symbols-outlined text-lg">add</span>
          {t.addProduct}
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card-dark rounded-xl border border-separator p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">
              Total Products
            </span>
            <span className="material-symbols-outlined text-primary">
              inventory_2
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-text-primary-dark">
            {stats.total}
          </p>
        </div>

        <div className="bg-card-dark rounded-xl border border-separator p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">
              In Stock
            </span>
            <span className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-text-primary-dark">
            {stats.inStock}
          </p>
        </div>

        <div className="bg-card-dark rounded-xl border border-separator p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">
              Low Stock
            </span>
            <span className="w-3 h-3 rounded-full bg-orange-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-text-primary-dark">
            {stats.lowStock}
          </p>
        </div>

        <div className="bg-card-dark rounded-xl border border-separator p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">
              Out of Stock
            </span>
            <span className="w-3 h-3 rounded-full bg-red-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-text-primary-dark">
            {stats.outOfStock}
          </p>
        </div>
      </div>

      {/* Low stock alert banner */}
      {lowStockProducts.length > 0 && (
        <LowStockAlert
          products={lowStockProducts}
          variant="banner"
          onViewAll={handleLowStockViewAll}
          onProductClick={handleLowStockProductClick}
          maxDisplay={5}
        />
      )}

      {/* Inventory table */}
      <div className="bg-card-dark rounded-xl border border-separator p-6">
        <InventoryTable
          products={products}
          onEdit={(product) => setModalState({ type: "edit", product })}
          onDelete={(product) => setModalState({ type: "delete", product })}
          onAdjustQuantity={(product) => setModalState({ type: "adjust", product })}
          isLoading={isLoading}
        />
      </div>

      {/* Create product modal */}
      {modalState.type === "create" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setModalState({ type: "none" })}
          />

          {/* Modal */}
          <div className="relative w-full max-w-lg bg-surface-dark rounded-xl border border-separator shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-separator sticky top-0 bg-surface-dark z-10">
              <h2 className="text-lg font-semibold text-text-primary-dark">
                {t.addProduct}
              </h2>
              <button
                type="button"
                onClick={() => setModalState({ type: "none" })}
                className="p-1 text-text-muted hover:text-text-primary-dark rounded-lg hover:bg-hover-row"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6">
              <ProductForm
                onSubmit={handleCreateSubmit}
                onCancel={() => setModalState({ type: "none" })}
                isLoading={createMutation.isPending}
              />
            </div>

            {createMutation.error && (
              <div className="px-6 pb-6">
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-400">
                    {createMutation.error.message}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit product modal */}
      {modalState.type === "edit" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setModalState({ type: "none" })}
          />
          <div className="relative w-full max-w-lg bg-surface-dark rounded-xl border border-separator shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-separator sticky top-0 bg-surface-dark z-10">
              <h2 className="text-lg font-semibold text-text-primary-dark">
                Edit Product
              </h2>
              <button
                type="button"
                onClick={() => setModalState({ type: "none" })}
                className="p-1 text-text-muted hover:text-text-primary-dark rounded-lg hover:bg-hover-row"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6">
              <ProductForm
                product={modalState.product}
                onSubmit={handleEditSubmit}
                onCancel={() => setModalState({ type: "none" })}
                isLoading={updateMutation.isPending}
              />
            </div>

            {updateMutation.error && (
              <div className="px-6 pb-6">
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-400">
                    {updateMutation.error.message}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {modalState.type === "delete" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setModalState({ type: "none" })}
          />
          <div className="relative w-full max-w-sm bg-surface-dark rounded-xl border border-separator shadow-2xl">
            <div className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-full bg-red-500/10">
                <span className="material-symbols-outlined text-3xl text-error">
                  delete
                </span>
              </div>
              <h2 className="text-lg font-semibold text-text-primary-dark mb-2">
                Delete {modalState.product.name}?
              </h2>
              <p className="text-sm text-text-secondary mb-6">
                This will deactivate the product. It can be restored later if needed.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setModalState({ type: "none" })}
                  disabled={deleteMutation.isPending}
                  className={cn(
                    "px-4 py-2 rounded-lg font-medium text-sm",
                    "bg-surface-dark border border-separator text-text-secondary",
                    "hover:bg-hover-row hover:text-text-primary-dark",
                    "disabled:opacity-50"
                  )}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className={cn(
                    "px-4 py-2 rounded-lg font-bold text-sm",
                    "bg-error text-white",
                    "hover:bg-red-600",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "flex items-center gap-2"
                  )}
                >
                  {deleteMutation.isPending && (
                    <span className="material-symbols-outlined animate-spin text-lg">
                      progress_activity
                    </span>
                  )}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Adjust quantity modal */}
      {modalState.type === "adjust" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setModalState({ type: "none" })}
          />
          <div className="relative w-full max-w-sm bg-surface-dark rounded-xl border border-separator shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-separator">
              <h2 className="text-lg font-semibold text-text-primary-dark">
                Adjust Quantity
              </h2>
              <button
                type="button"
                onClick={() => setModalState({ type: "none" })}
                className="p-1 text-text-muted hover:text-text-primary-dark rounded-lg hover:bg-hover-row"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-text-secondary mb-1">Product</p>
                <p className="font-semibold text-text-primary-dark">
                  {modalState.product.name}
                </p>
                <p className="text-sm text-text-muted">
                  Current: {Number(modalState.product.quantity).toFixed(2)}
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="adjustment"
                  className="block text-sm font-medium text-text-primary-dark"
                >
                  Adjustment (+ to add, - to subtract)
                </label>
                <input
                  id="adjustment"
                  type="number"
                  step="0.01"
                  value={adjustmentValue}
                  onChange={(e) => setAdjustmentValue(e.target.value)}
                  placeholder="e.g., +10 or -5"
                  className={cn(
                    "w-full h-10 px-4 rounded-lg",
                    "bg-surface-dark border border-separator text-text-primary-dark",
                    "placeholder:text-text-muted",
                    "focus:outline-none focus:border-primary/50"
                  )}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="reason"
                  className="block text-sm font-medium text-text-primary-dark"
                >
                  Reason <span className="text-text-muted">(optional)</span>
                </label>
                <input
                  id="reason"
                  type="text"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="e.g., Received shipment, Waste, Correction"
                  className={cn(
                    "w-full h-10 px-4 rounded-lg",
                    "bg-surface-dark border border-separator text-text-primary-dark",
                    "placeholder:text-text-muted",
                    "focus:outline-none focus:border-primary/50"
                  )}
                />
              </div>

              {adjustmentValue && !isNaN(parseFloat(adjustmentValue)) && (
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm text-text-primary-dark">
                    New quantity will be:{" "}
                    <span className="font-bold">
                      {(
                        Number(modalState.product.quantity) +
                        parseFloat(adjustmentValue)
                      ).toFixed(2)}
                    </span>
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalState({ type: "none" });
                    setAdjustmentValue("");
                    setAdjustmentReason("");
                  }}
                  disabled={adjustMutation.isPending}
                  className={cn(
                    "px-4 py-2 rounded-lg font-medium text-sm",
                    "bg-surface-dark border border-separator text-text-secondary",
                    "hover:bg-hover-row hover:text-text-primary-dark",
                    "disabled:opacity-50"
                  )}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAdjustQuantity}
                  disabled={
                    adjustMutation.isPending ||
                    !adjustmentValue ||
                    isNaN(parseFloat(adjustmentValue)) ||
                    parseFloat(adjustmentValue) === 0
                  }
                  className={cn(
                    "px-4 py-2 rounded-lg font-bold text-sm",
                    "bg-primary text-white",
                    "hover:bg-primary-dark",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "flex items-center gap-2"
                  )}
                >
                  {adjustMutation.isPending && (
                    <span className="material-symbols-outlined animate-spin text-lg">
                      progress_activity
                    </span>
                  )}
                  Apply Adjustment
                </button>
              </div>

              {adjustMutation.error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-400">
                    {adjustMutation.error.message}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryPageClient;
