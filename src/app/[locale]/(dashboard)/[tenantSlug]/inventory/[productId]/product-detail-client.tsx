"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product, Unit } from "@prisma/client";
import { cn, formatCurrency } from "@/lib/utils";
import { api } from "@/lib/trpc/client";
import { ProductForm, type ProductFormData } from "@/components/features/inventory";

/**
 * ProductDetailClient Component
 *
 * Client-side product detail view with actions.
 * Allows viewing, editing, adjusting quantity, and deleting a product.
 */

type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

interface ProductWithStatus extends Product {
  stockStatus: StockStatus;
}

interface ProductDetailClientProps {
  product: ProductWithStatus;
  tenantSlug: string;
  locale: string;
  translations: {
    title: string;
    quantity: string;
    unit: string;
    alertThreshold: string;
    edit: string;
    delete: string;
    save: string;
    cancel: string;
    back: string;
  };
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

// Unit full names
const unitFullNames: Record<Unit, string> = {
  KILOGRAM: "Kilogram",
  GRAM: "Gram",
  LITER: "Liter",
  MILLILITER: "Milliliter",
  UNIT: "Unit",
  PORTION: "Portion",
};

// Status configuration
const statusConfig: Record<StockStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}> = {
  "in-stock": {
    label: "In Stock",
    color: "text-green-400",
    bgColor: "bg-green-500/10 border-green-500/20",
    icon: "check_circle",
  },
  "low-stock": {
    label: "Low Stock",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10 border-orange-500/20",
    icon: "warning",
  },
  "out-of-stock": {
    label: "Out of Stock",
    color: "text-red-400",
    bgColor: "bg-red-500/10 border-red-500/20",
    icon: "cancel",
  },
};

type ModalState =
  | { type: "none" }
  | { type: "edit" }
  | { type: "delete" }
  | { type: "adjust" };

export function ProductDetailClient({
  product: initialProduct,
  tenantSlug,
  locale,
  translations: t,
}: ProductDetailClientProps) {
  const router = useRouter();
  const [modalState, setModalState] = useState<ModalState>({ type: "none" });
  const [adjustmentValue, setAdjustmentValue] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");

  // Fetch product with initial data
  const { data: product = initialProduct, refetch } = api.inventory.getById.useQuery(
    { id: initialProduct.id },
    { initialData: initialProduct }
  );

  // Update mutation
  const updateMutation = api.inventory.update.useMutation({
    onSuccess: () => {
      setModalState({ type: "none" });
      refetch();
    },
  });

  // Delete mutation
  const deleteMutation = api.inventory.delete.useMutation({
    onSuccess: () => {
      router.push(`/${locale}/${tenantSlug}/inventory`);
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

  const handleUpdateSubmit = (data: ProductFormData) => {
    updateMutation.mutate({
      id: product.id,
      ...data,
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id: product.id });
  };

  const handleAdjustQuantity = () => {
    const adjustment = parseFloat(adjustmentValue);
    if (isNaN(adjustment) || adjustment === 0) return;

    adjustMutation.mutate({
      id: product.id,
      adjustment,
      reason: adjustmentReason || undefined,
    });
  };

  const currentStatus = statusConfig[product.stockStatus];
  const quantity = Number(product.quantity);
  const alertThreshold = Number(product.alertThreshold);
  const costPerUnit = product.costPerUnit ? Number(product.costPerUnit) : null;

  return (
    <div className="space-y-6">
      {/* Back button and header */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.push(`/${locale}/${tenantSlug}/inventory`)}
          className={cn(
            "p-2 rounded-lg",
            "text-text-secondary hover:text-text-primary-dark",
            "hover:bg-hover-row"
          )}
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-text-primary-dark tracking-tight">
            {product.name}
          </h1>
          <p className="text-text-secondary">{unitFullNames[product.unit]}</p>
        </div>
        {/* Status badge in header */}
        <span
          className={cn(
            "px-3 py-1.5 rounded-full text-sm font-medium border flex items-center gap-2",
            currentStatus.bgColor,
            currentStatus.color
          )}
        >
          <span className="material-symbols-outlined text-lg">
            {currentStatus.icon}
          </span>
          {currentStatus.label}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column - Product info and quantity */}
        <div className="space-y-6">
          {/* Product info card */}
          <div className="bg-card-dark rounded-xl border border-separator p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-text-primary-dark">
                Product Information
              </h2>
              <button
                type="button"
                onClick={() => setModalState({ type: "edit" })}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium",
                  "text-text-secondary hover:text-text-primary-dark",
                  "hover:bg-hover-row"
                )}
              >
                <span className="material-symbols-outlined text-lg">edit</span>
                {t.edit}
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div className="flex items-center justify-between py-2 border-b border-separator">
                <span className="text-text-secondary">Name</span>
                <span className="text-text-primary-dark font-medium">
                  {product.name}
                </span>
              </div>

              {/* Unit */}
              <div className="flex items-center justify-between py-2 border-b border-separator">
                <span className="text-text-secondary">{t.unit}</span>
                <span className="text-text-primary-dark font-medium">
                  {unitFullNames[product.unit]} ({unitLabels[product.unit]})
                </span>
              </div>

              {/* Current quantity */}
              <div className="flex items-center justify-between py-2 border-b border-separator">
                <span className="text-text-secondary">{t.quantity}</span>
                <span
                  className={cn(
                    "font-semibold",
                    product.stockStatus === "out-of-stock"
                      ? "text-red-400"
                      : product.stockStatus === "low-stock"
                        ? "text-orange-400"
                        : "text-text-primary-dark"
                  )}
                >
                  {quantity.toFixed(2)} {unitLabels[product.unit]}
                </span>
              </div>

              {/* Alert threshold */}
              <div className="flex items-center justify-between py-2 border-b border-separator">
                <span className="text-text-secondary">{t.alertThreshold}</span>
                <span className="text-text-primary-dark font-medium">
                  {alertThreshold.toFixed(2)} {unitLabels[product.unit]}
                </span>
              </div>

              {/* Cost per unit */}
              <div className="flex items-center justify-between py-2 border-b border-separator">
                <span className="text-text-secondary">Cost per Unit</span>
                <span className="text-text-primary-dark font-medium">
                  {costPerUnit ? formatCurrency(costPerUnit) : "Not set"}
                </span>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between py-2">
                <span className="text-text-secondary">Status</span>
                <span
                  className={cn(
                    "px-3 py-1 rounded-full text-sm font-medium border",
                    currentStatus.bgColor,
                    currentStatus.color
                  )}
                >
                  {currentStatus.label}
                </span>
              </div>
            </div>
          </div>

          {/* Quantity adjustment card */}
          <div className="bg-card-dark rounded-xl border border-separator p-6">
            <h2 className="text-lg font-semibold text-text-primary-dark mb-4">
              Quick Adjust
            </h2>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {[-10, -5, -1, 1, 5, 10].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    adjustMutation.mutate({
                      id: product.id,
                      adjustment: value,
                    });
                  }}
                  disabled={adjustMutation.isPending}
                  className={cn(
                    "py-3 rounded-lg font-medium text-sm transition-colors border",
                    value < 0
                      ? "border-red-500/20 text-red-400 hover:bg-red-500/10"
                      : "border-green-500/20 text-green-400 hover:bg-green-500/10",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {value > 0 ? `+${value}` : value}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setModalState({ type: "adjust" })}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium text-sm",
                "bg-primary/10 text-primary border border-primary/20",
                "hover:bg-primary/20"
              )}
            >
              <span className="material-symbols-outlined text-lg">edit</span>
              Custom Adjustment
            </button>
          </div>

          {/* Danger zone */}
          <div className="bg-card-dark rounded-xl border border-red-500/20 p-6">
            <h2 className="text-lg font-semibold text-error mb-2">
              Danger Zone
            </h2>
            <p className="text-sm text-text-secondary mb-4">
              Deleting a product will deactivate it. Products used in recipes cannot be permanently deleted.
            </p>
            <button
              type="button"
              onClick={() => setModalState({ type: "delete" })}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                "bg-red-500/10 text-red-400 border border-red-500/20",
                "hover:bg-red-500/20"
              )}
            >
              <span className="material-symbols-outlined text-lg">delete</span>
              Delete Product
            </button>
          </div>
        </div>

        {/* Right column - Stock level visualization */}
        <div className="space-y-6">
          {/* Stock level card */}
          <div className="bg-card-dark rounded-xl border border-separator p-6">
            <h2 className="text-lg font-semibold text-text-primary-dark mb-6">
              Stock Level
            </h2>

            {/* Visual gauge */}
            <div className="relative mb-6">
              <div className="flex items-center justify-center">
                <div className="relative w-48 h-48">
                  {/* Background circle */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="12"
                      className="text-separator"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={`${Math.min(
                        (quantity / Math.max(alertThreshold * 2, quantity, 1)) * 553,
                        553
                      )} 553`}
                      className={cn(
                        product.stockStatus === "out-of-stock"
                          ? "text-red-400"
                          : product.stockStatus === "low-stock"
                            ? "text-orange-400"
                            : "text-green-400"
                      )}
                    />
                  </svg>
                  {/* Center text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span
                      className={cn(
                        "text-4xl font-bold",
                        product.stockStatus === "out-of-stock"
                          ? "text-red-400"
                          : product.stockStatus === "low-stock"
                            ? "text-orange-400"
                            : "text-text-primary-dark"
                      )}
                    >
                      {quantity.toFixed(1)}
                    </span>
                    <span className="text-sm text-text-muted">
                      {unitLabels[product.unit]}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Threshold indicator */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-dark border border-separator">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-400">
                  notification_important
                </span>
                <span className="text-sm text-text-secondary">Alert when below</span>
              </div>
              <span className="font-semibold text-text-primary-dark">
                {alertThreshold.toFixed(1)} {unitLabels[product.unit]}
              </span>
            </div>

            {/* Status message */}
            <div
              className={cn(
                "mt-4 p-4 rounded-lg border",
                currentStatus.bgColor
              )}
            >
              <div className="flex items-start gap-3">
                <span className={cn("material-symbols-outlined text-2xl", currentStatus.color)}>
                  {currentStatus.icon}
                </span>
                <div>
                  <p className={cn("font-semibold", currentStatus.color)}>
                    {currentStatus.label}
                  </p>
                  <p className="text-sm text-text-secondary mt-1">
                    {product.stockStatus === "out-of-stock"
                      ? "This product is out of stock. Restock immediately."
                      : product.stockStatus === "low-stock"
                        ? `Only ${quantity.toFixed(1)} ${unitLabels[product.unit]} remaining. Consider restocking soon.`
                        : `Stock level is healthy at ${quantity.toFixed(1)} ${unitLabels[product.unit]}.`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Product metadata */}
          <div className="bg-card-dark rounded-xl border border-separator p-6">
            <h2 className="text-lg font-semibold text-text-primary-dark mb-4">
              Details
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Created</span>
                <span className="text-text-secondary">
                  {new Date(product.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Last Updated</span>
                <span className="text-text-secondary">
                  {new Date(product.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">ID</span>
                <span className="text-text-secondary font-mono text-xs">
                  {product.id}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit modal */}
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
                product={product}
                onSubmit={handleUpdateSubmit}
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
                Delete {product.name}?
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
                  {t.cancel}
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
                  {t.delete}
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
                Custom Adjustment
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
                <p className="text-sm text-text-secondary mb-1">Current Quantity</p>
                <p className="font-semibold text-text-primary-dark">
                  {quantity.toFixed(2)} {unitLabels[product.unit]}
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
                  placeholder="e.g., Received shipment, Waste"
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
                    New quantity:{" "}
                    <span className="font-bold">
                      {(quantity + parseFloat(adjustmentValue)).toFixed(2)} {unitLabels[product.unit]}
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
                  {t.cancel}
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
                  Apply
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

export default ProductDetailClient;
