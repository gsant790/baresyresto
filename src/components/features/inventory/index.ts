/**
 * Inventory Components
 *
 * Re-exports all inventory-related components for convenient imports.
 */

export { InventoryTable } from "./inventory-table";
export type { ProductWithStatus, StockStatus } from "./inventory-table";

export { ProductForm } from "./product-form";
export type { ProductFormData } from "./product-form";

export { LowStockAlert } from "./low-stock-alert";
export type { LowStockProduct } from "./low-stock-alert";
