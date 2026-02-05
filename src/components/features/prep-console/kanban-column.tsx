"use client";

import { cn } from "@/lib/utils";
import { OrderCard, type OrderCardData } from "./order-card";
import type { OrderItemStatus } from "@prisma/client";

/**
 * KanbanColumn Component
 *
 * A single column in the Kanban board displaying orders of a specific status.
 * Shows column header with count and contains scrollable order cards.
 */

interface KanbanColumnProps {
  /** Column title */
  title: string;
  /** Orders to display in this column */
  orders: OrderCardData[];
  /** Status this column represents */
  status: OrderItemStatus;
  /** Callback when action is triggered on an order */
  onAction: (orderId: string, itemIds: string[], newStatus: OrderItemStatus) => void;
  /** Order IDs currently loading */
  loadingOrderIds: string[];
  /** Translation strings for order cards */
  translations: {
    table: string;
    order: string;
    startPrep: string;
    markReady: string;
    markServed: string;
    allergyWarning: string;
    noOrders: string;
  };
}

export function KanbanColumn({
  title,
  orders,
  status,
  onAction,
  loadingOrderIds,
  translations: t,
}: KanbanColumnProps) {
  // Get the header color based on status
  const getHeaderColor = (status: OrderItemStatus) => {
    switch (status) {
      case "PENDING":
        return "bg-blue-500/20 border-blue-500/30 text-blue-400";
      case "IN_PROGRESS":
        return "bg-orange-500/20 border-orange-500/30 text-orange-400";
      case "READY":
        return "bg-green-500/20 border-green-500/30 text-green-400";
      default:
        return "bg-separator text-text-secondary";
    }
  };

  // Get the count badge color
  const getCountColor = (status: OrderItemStatus) => {
    switch (status) {
      case "PENDING":
        return "bg-blue-500 text-white";
      case "IN_PROGRESS":
        return "bg-orange-500 text-white";
      case "READY":
        return "bg-green-500 text-white";
      default:
        return "bg-separator text-text-primary-dark";
    }
  };

  return (
    <div className="flex flex-col h-full min-w-[320px] flex-1">
      {/* Column Header */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-3 rounded-t-lg border",
          getHeaderColor(status)
        )}
      >
        <h3 className="font-bold text-lg">{title}</h3>
        <span
          className={cn(
            "flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full font-bold text-sm",
            getCountColor(status)
          )}
        >
          {orders.length}
        </span>
      </div>

      {/* Column Content - Scrollable */}
      <div className="flex-1 overflow-y-auto bg-surface-dark/50 rounded-b-lg border border-t-0 border-separator p-3 space-y-3">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-text-muted">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">
              {status === "PENDING" ? "inbox" : status === "IN_PROGRESS" ? "skillet" : "check_circle"}
            </span>
            <p className="text-sm">{t.noOrders}</p>
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.orderId}
              order={order}
              onAction={onAction}
              isLoading={loadingOrderIds.includes(order.orderId)}
              translations={t}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default KanbanColumn;
