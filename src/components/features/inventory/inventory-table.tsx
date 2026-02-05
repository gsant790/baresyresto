"use client";

import { useState } from "react";
import type { Product, Unit } from "@prisma/client";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

/**
 * InventoryTable Component
 *
 * Displays a table of inventory products with stock status indicators,
 * filtering options, and action buttons for each product.
 */

export type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

export interface ProductWithStatus extends Product {
  stockStatus: StockStatus;
}

interface InventoryTableProps {
  products: ProductWithStatus[];
  onEdit?: (product: ProductWithStatus) => void;
  onDelete?: (product: ProductWithStatus) => void;
  onAdjustQuantity?: (product: ProductWithStatus) => void;
  isLoading?: boolean;
}

type FilterOption = "ALL" | StockStatus;

// Unit display labels
const unitLabels: Record<Unit, string> = {
  KILOGRAM: "kg",
  GRAM: "g",
  LITER: "L",
  MILLILITER: "ml",
  UNIT: "units",
  PORTION: "portions",
};

// Filter configuration
const filterOptions: { value: FilterOption; label: string; icon: string }[] = [
  { value: "ALL", label: "All", icon: "inventory_2" },
  { value: "in-stock", label: "In Stock", icon: "check_circle" },
  { value: "low-stock", label: "Low Stock", icon: "warning" },
  { value: "out-of-stock", label: "Out of Stock", icon: "cancel" },
];

// Status colors for filters and badges
const statusColors: Record<FilterOption, { filter: string; badge: string }> = {
  ALL: {
    filter: "bg-slate-500/10 text-slate-400",
    badge: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  },
  "in-stock": {
    filter: "bg-green-500/10 text-green-400",
    badge: "bg-green-500/10 text-green-400 border-green-500/20",
  },
  "low-stock": {
    filter: "bg-orange-500/10 text-orange-400",
    badge: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  },
  "out-of-stock": {
    filter: "bg-red-500/10 text-red-400",
    badge: "bg-red-500/10 text-red-400 border-red-500/20",
  },
};

// Status display labels
const statusLabels: Record<StockStatus, string> = {
  "in-stock": "In Stock",
  "low-stock": "Low Stock",
  "out-of-stock": "Out of Stock",
};

export function InventoryTable({
  products,
  onEdit,
  onDelete,
  onAdjustQuantity,
  isLoading,
}: InventoryTableProps) {
  const [filter, setFilter] = useState<FilterOption>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Calculate counts for each status
  const counts = products.reduce(
    (acc, product) => {
      acc[product.stockStatus] = (acc[product.stockStatus] || 0) + 1;
      acc.ALL = (acc.ALL || 0) + 1;
      return acc;
    },
    { ALL: 0 } as Record<FilterOption, number>
  );

  // Filter products based on selected status and search
  const filteredProducts = products.filter((product) => {
    const matchesFilter =
      filter === "ALL" || product.stockStatus === filter;
    const matchesSearch =
      !searchQuery ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            search
          </span>
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full h-10 pl-10 pr-4 rounded-lg",
              "bg-surface-dark border border-separator text-text-primary-dark",
              "placeholder:text-text-muted",
              "focus:outline-none focus:border-primary/50"
            )}
          />
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                filter === option.value
                  ? "bg-primary/20 text-primary border border-primary/10"
                  : "bg-card-dark text-text-secondary border border-separator hover:bg-hover-row hover:text-text-primary-dark"
              )}
            >
              <span className="material-symbols-outlined text-base">
                {option.icon}
              </span>
              <span className="hidden sm:inline">{option.label}</span>
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-xs font-bold",
                  statusColors[option.value].filter
                )}
              >
                {counts[option.value] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">
            progress_activity
          </span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <span className="material-symbols-outlined text-5xl text-text-muted mb-4">
            inventory_2
          </span>
          <p className="text-text-secondary">
            {searchQuery
              ? "No products match your search."
              : filter === "ALL"
                ? "No products found. Add your first product to get started."
                : `No ${statusLabels[filter as StockStatus].toLowerCase()} products.`}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-separator">
          <table className="w-full">
            <thead>
              <tr className="border-b border-separator bg-table-header">
                <th className="py-4 px-6 text-left text-xs font-bold uppercase tracking-wider text-text-muted">
                  Product
                </th>
                <th className="py-4 px-6 text-left text-xs font-bold uppercase tracking-wider text-text-muted">
                  Status
                </th>
                <th className="py-4 px-6 text-right text-xs font-bold uppercase tracking-wider text-text-muted">
                  Quantity
                </th>
                <th className="py-4 px-6 text-right text-xs font-bold uppercase tracking-wider text-text-muted">
                  Alert At
                </th>
                <th className="py-4 px-6 text-right text-xs font-bold uppercase tracking-wider text-text-muted">
                  Cost/Unit
                </th>
                <th className="py-4 px-6 text-right text-xs font-bold uppercase tracking-wider text-text-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className="group border-b border-separator last:border-b-0 hover:bg-hover-row transition-colors"
                >
                  {/* Product name */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center text-lg",
                          product.stockStatus === "out-of-stock"
                            ? "bg-red-500/10 text-red-400"
                            : product.stockStatus === "low-stock"
                              ? "bg-orange-500/10 text-orange-400"
                              : "bg-primary/10 text-primary"
                        )}
                      >
                        <span className="material-symbols-outlined">
                          package_2
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-text-primary-dark">
                          {product.name}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {unitLabels[product.unit]}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Status badge */}
                  <td className="py-4 px-6">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                        statusColors[product.stockStatus].badge
                      )}
                    >
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          product.stockStatus === "out-of-stock"
                            ? "bg-red-400"
                            : product.stockStatus === "low-stock"
                              ? "bg-orange-400"
                              : "bg-green-400"
                        )}
                      />
                      {statusLabels[product.stockStatus]}
                    </span>
                  </td>

                  {/* Quantity */}
                  <td className="py-4 px-6 text-right">
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
                      {Number(product.quantity).toFixed(2)}
                    </span>
                    <span className="text-text-muted ml-1 text-sm">
                      {unitLabels[product.unit]}
                    </span>
                  </td>

                  {/* Alert threshold */}
                  <td className="py-4 px-6 text-right">
                    <span className="text-text-secondary">
                      {Number(product.alertThreshold).toFixed(2)}
                    </span>
                    <span className="text-text-muted ml-1 text-sm">
                      {unitLabels[product.unit]}
                    </span>
                  </td>

                  {/* Cost per unit */}
                  <td className="py-4 px-6 text-right">
                    {product.costPerUnit ? (
                      <span className="text-text-primary-dark">
                        {formatCurrency(Number(product.costPerUnit))}
                      </span>
                    ) : (
                      <span className="text-text-muted">-</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onAdjustQuantity && (
                        <button
                          type="button"
                          onClick={() => onAdjustQuantity(product)}
                          title="Adjust quantity"
                          className="p-2 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">
                            add_circle
                          </span>
                        </button>
                      )}
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(product)}
                          title="Edit product"
                          className="p-2 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">
                            edit
                          </span>
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(product)}
                          title="Delete product"
                          className="p-2 text-text-secondary hover:text-error hover:bg-red-400/10 rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">
                            delete
                          </span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default InventoryTable;
