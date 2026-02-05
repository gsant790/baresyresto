"use client";

import { useState, type FormEvent } from "react";
import type { Product, Unit } from "@prisma/client";
import { cn } from "@/lib/utils";

/**
 * ProductForm Component
 *
 * Form for creating or editing an inventory product.
 * Includes fields for name, unit, quantity, alert threshold, and cost per unit.
 */

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: ProductFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface ProductFormData {
  name: string;
  unit: Unit;
  quantity: number;
  alertThreshold: number;
  costPerUnit?: number | null;
}

// Unit options with display labels
const unitOptions: { value: Unit; label: string; shortLabel: string }[] = [
  { value: "KILOGRAM", label: "Kilogram", shortLabel: "kg" },
  { value: "GRAM", label: "Gram", shortLabel: "g" },
  { value: "LITER", label: "Liter", shortLabel: "L" },
  { value: "MILLILITER", label: "Milliliter", shortLabel: "ml" },
  { value: "UNIT", label: "Unit", shortLabel: "units" },
  { value: "PORTION", label: "Portion", shortLabel: "portions" },
];

export function ProductForm({
  product,
  onSubmit,
  onCancel,
  isLoading,
}: ProductFormProps) {
  const [name, setName] = useState(product?.name || "");
  const [unit, setUnit] = useState<Unit>(product?.unit || "UNIT");
  const [quantity, setQuantity] = useState(
    product?.quantity ? Number(product.quantity).toString() : ""
  );
  const [alertThreshold, setAlertThreshold] = useState(
    product?.alertThreshold ? Number(product.alertThreshold).toString() : ""
  );
  const [costPerUnit, setCostPerUnit] = useState(
    product?.costPerUnit ? Number(product.costPerUnit).toString() : ""
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = !!product;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate name
    if (!name.trim()) {
      newErrors.name = "Product name is required";
    } else if (name.length > 100) {
      newErrors.name = "Product name must be 100 characters or less";
    }

    // Validate quantity
    const qtyValue = parseFloat(quantity);
    if (!quantity || isNaN(qtyValue) || qtyValue < 0) {
      newErrors.quantity = "Quantity must be a non-negative number";
    }

    // Validate alert threshold
    const thresholdValue = parseFloat(alertThreshold);
    if (!alertThreshold || isNaN(thresholdValue) || thresholdValue < 0) {
      newErrors.alertThreshold = "Alert threshold must be a non-negative number";
    }

    // Validate cost per unit (optional but must be valid if provided)
    if (costPerUnit) {
      const costValue = parseFloat(costPerUnit);
      if (isNaN(costValue) || costValue < 0) {
        newErrors.costPerUnit = "Cost per unit must be a non-negative number";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    onSubmit({
      name: name.trim(),
      unit,
      quantity: parseFloat(quantity),
      alertThreshold: parseFloat(alertThreshold),
      costPerUnit: costPerUnit ? parseFloat(costPerUnit) : null,
    });
  };

  // Get the short label for the currently selected unit
  const selectedUnitShortLabel =
    unitOptions.find((u) => u.value === unit)?.shortLabel || "";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Product Name */}
      <div className="space-y-2">
        <label
          htmlFor="product-name"
          className="block text-sm font-medium text-text-primary-dark"
        >
          Product Name <span className="text-error">*</span>
        </label>
        <input
          id="product-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Tomatoes, Olive Oil, Chicken Breast"
          className={cn(
            "w-full h-10 px-4 rounded-lg",
            "bg-surface-dark border text-text-primary-dark",
            "placeholder:text-text-muted",
            "focus:outline-none focus:border-primary/50",
            errors.name ? "border-error" : "border-separator"
          )}
          disabled={isLoading}
          autoFocus
        />
        {errors.name && <p className="text-xs text-error">{errors.name}</p>}
      </div>

      {/* Unit */}
      <div className="space-y-2">
        <label
          htmlFor="product-unit"
          className="block text-sm font-medium text-text-primary-dark"
        >
          Unit of Measure <span className="text-error">*</span>
        </label>
        <div className="relative">
          <select
            id="product-unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value as Unit)}
            className={cn(
              "w-full h-10 px-4 pr-10 rounded-lg appearance-none",
              "bg-surface-dark border border-separator text-text-primary-dark",
              "focus:outline-none focus:border-primary/50"
            )}
            disabled={isLoading}
          >
            {unitOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} ({option.shortLabel})
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            expand_more
          </span>
        </div>
      </div>

      {/* Quantity and Alert Threshold - side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Quantity */}
        <div className="space-y-2">
          <label
            htmlFor="product-quantity"
            className="block text-sm font-medium text-text-primary-dark"
          >
            Current Quantity <span className="text-error">*</span>
          </label>
          <div className="relative">
            <input
              id="product-quantity"
              type="number"
              step="0.01"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0.00"
              className={cn(
                "w-full h-10 px-4 pr-16 rounded-lg",
                "bg-surface-dark border text-text-primary-dark",
                "placeholder:text-text-muted",
                "focus:outline-none focus:border-primary/50",
                errors.quantity ? "border-error" : "border-separator"
              )}
              disabled={isLoading}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">
              {selectedUnitShortLabel}
            </span>
          </div>
          {errors.quantity && (
            <p className="text-xs text-error">{errors.quantity}</p>
          )}
        </div>

        {/* Alert Threshold */}
        <div className="space-y-2">
          <label
            htmlFor="product-threshold"
            className="block text-sm font-medium text-text-primary-dark"
          >
            Alert Threshold <span className="text-error">*</span>
          </label>
          <div className="relative">
            <input
              id="product-threshold"
              type="number"
              step="0.01"
              min="0"
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(e.target.value)}
              placeholder="0.00"
              className={cn(
                "w-full h-10 px-4 pr-16 rounded-lg",
                "bg-surface-dark border text-text-primary-dark",
                "placeholder:text-text-muted",
                "focus:outline-none focus:border-primary/50",
                errors.alertThreshold ? "border-error" : "border-separator"
              )}
              disabled={isLoading}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">
              {selectedUnitShortLabel}
            </span>
          </div>
          {errors.alertThreshold && (
            <p className="text-xs text-error">{errors.alertThreshold}</p>
          )}
          <p className="text-xs text-text-muted">
            You will be alerted when quantity falls below this threshold
          </p>
        </div>
      </div>

      {/* Cost per Unit (optional) */}
      <div className="space-y-2">
        <label
          htmlFor="product-cost"
          className="block text-sm font-medium text-text-primary-dark"
        >
          Cost per Unit
          <span className="text-text-muted ml-1">(optional)</span>
        </label>
        <div className="relative max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            EUR
          </span>
          <input
            id="product-cost"
            type="number"
            step="0.01"
            min="0"
            value={costPerUnit}
            onChange={(e) => setCostPerUnit(e.target.value)}
            placeholder="0.00"
            className={cn(
              "w-full h-10 pl-12 pr-4 rounded-lg",
              "bg-surface-dark border text-text-primary-dark",
              "placeholder:text-text-muted",
              "focus:outline-none focus:border-primary/50",
              errors.costPerUnit ? "border-error" : "border-separator"
            )}
            disabled={isLoading}
          />
        </div>
        {errors.costPerUnit && (
          <p className="text-xs text-error">{errors.costPerUnit}</p>
        )}
        <p className="text-xs text-text-muted">
          Track purchase cost per {selectedUnitShortLabel || "unit"} for cost analysis
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-separator">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className={cn(
            "px-4 py-2 rounded-lg font-medium text-sm",
            "bg-surface-dark border border-separator text-text-secondary",
            "hover:bg-hover-row hover:text-text-primary-dark",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "px-6 py-2 rounded-lg font-bold text-sm",
            "bg-primary text-white",
            "hover:bg-primary-dark",
            "shadow-lg shadow-primary/20",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "flex items-center gap-2"
          )}
        >
          {isLoading && (
            <span className="material-symbols-outlined animate-spin text-lg">
              progress_activity
            </span>
          )}
          {isEdit ? "Save Changes" : "Add Product"}
        </button>
      </div>
    </form>
  );
}

export default ProductForm;
