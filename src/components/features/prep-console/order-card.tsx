"use client";

import { cn } from "@/lib/utils";
import { ElapsedTimer } from "./elapsed-timer";
import { AllergyBadge } from "./allergy-badge";
import type { OrderItemStatus } from "@prisma/client";

/**
 * OrderCard Component
 *
 * Displays a single order in the Kanban board.
 * Shows table number, order details, elapsed time, allergen warnings,
 * and action buttons for status transitions.
 */

export interface OrderCardItem {
  id: string;
  dishId: string;
  dishName: string;
  dishNameEn?: string | null;
  quantity: number;
  notes?: string | null;
  status: OrderItemStatus;
  allergens: string[];
}

export interface OrderCardData {
  orderId: string;
  orderNumber: number;
  tableNumber: number;
  tableName?: string | null;
  createdAt: Date | string;
  customerNotes?: string | null;
  items: OrderCardItem[];
  status: OrderItemStatus;
}

interface OrderCardProps {
  /** Order data to display */
  order: OrderCardData;
  /** Callback when action button is clicked */
  onAction: (orderId: string, itemIds: string[], newStatus: OrderItemStatus) => void;
  /** Whether an action is in progress */
  isLoading?: boolean;
  /** Translation strings */
  translations: {
    table: string;
    order: string;
    startPrep: string;
    markReady: string;
    markServed: string;
    allergyWarning: string;
  };
}

export function OrderCard({
  order,
  onAction,
  isLoading = false,
  translations: t,
}: OrderCardProps) {
  // Collect all allergens from all items
  const allAllergens = Array.from(
    new Set(order.items.flatMap((item) => item.allergens))
  );

  // Get the status color for the card border
  const getStatusBorderColor = (status: OrderItemStatus) => {
    switch (status) {
      case "PENDING":
        return "border-l-blue-500";
      case "IN_PROGRESS":
        return "border-l-orange-500";
      case "READY":
        return "border-l-green-500";
      default:
        return "border-l-separator";
    }
  };

  // Get the action button label and target status
  const getActionConfig = (status: OrderItemStatus) => {
    switch (status) {
      case "PENDING":
        return {
          label: t.startPrep,
          targetStatus: "IN_PROGRESS" as OrderItemStatus,
          icon: "play_arrow",
          bgColor: "bg-blue-600 hover:bg-blue-700",
        };
      case "IN_PROGRESS":
        return {
          label: t.markReady,
          targetStatus: "READY" as OrderItemStatus,
          icon: "check",
          bgColor: "bg-orange-600 hover:bg-orange-700",
        };
      case "READY":
        return {
          label: t.markServed,
          targetStatus: "SERVED" as OrderItemStatus,
          icon: "done_all",
          bgColor: "bg-green-600 hover:bg-green-700",
        };
      default:
        return null;
    }
  };

  const actionConfig = getActionConfig(order.status);
  const itemIds = order.items.map((item) => item.id);

  const handleAction = () => {
    if (actionConfig) {
      onAction(order.orderId, itemIds, actionConfig.targetStatus);
    }
  };

  return (
    <div
      className={cn(
        "bg-card-dark rounded-lg border border-separator border-l-4 shadow-sm",
        "transition-all duration-200 hover:shadow-md",
        getStatusBorderColor(order.status)
      )}
    >
      {/* Card Header */}
      <div className="px-4 py-3 border-b border-separator">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">
                table_restaurant
              </span>
              <span className="font-bold text-text-primary-dark text-lg">
                {t.table} {order.tableNumber}
              </span>
            </div>
            <span className="text-text-muted text-sm">
              #{order.orderNumber}
            </span>
          </div>
          <ElapsedTimer startTime={order.createdAt} large />
        </div>

        {/* Allergy warning - prominent display */}
        {allAllergens.length > 0 && (
          <div className="mt-2">
            <AllergyBadge allergens={allAllergens} />
          </div>
        )}
      </div>

      {/* Items List */}
      <div className="px-4 py-3 space-y-2">
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-2"
          >
            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-primary/20 text-primary rounded font-bold text-sm">
              {item.quantity}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-text-primary-dark font-medium truncate">
                {item.dishName}
              </p>
              {item.notes && (
                <p className="text-xs text-orange-400 italic mt-0.5">
                  {item.notes}
                </p>
              )}
              {item.allergens.length > 0 && (
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-red-400 text-xs">
                    warning
                  </span>
                  <span className="text-xs text-red-400">
                    {item.allergens.join(", ")}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Customer notes for the whole order */}
        {order.customerNotes && (
          <div className="mt-2 pt-2 border-t border-separator">
            <p className="text-xs text-text-muted italic flex items-start gap-1">
              <span className="material-symbols-outlined text-sm">note</span>
              {order.customerNotes}
            </p>
          </div>
        )}
      </div>

      {/* Action Button */}
      {actionConfig && (
        <div className="px-4 py-3 border-t border-separator">
          <button
            type="button"
            onClick={handleAction}
            disabled={isLoading}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg",
              "font-bold text-white text-sm",
              "transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              actionConfig.bgColor
            )}
          >
            {isLoading ? (
              <span className="material-symbols-outlined animate-spin">
                progress_activity
              </span>
            ) : (
              <>
                <span className="material-symbols-outlined">
                  {actionConfig.icon}
                </span>
                {actionConfig.label}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default OrderCard;
