"use client";

import { KanbanColumn } from "./kanban-column";
import type { OrderCardData } from "./order-card";
import type { OrderItemStatus } from "@prisma/client";

/**
 * KanbanBoard Component
 *
 * Three-column Kanban board for order preparation management.
 * Columns: NEW (PENDING) | IN PREP (IN_PROGRESS) | READY
 *
 * Provides a visual workflow for kitchen and bar staff to
 * track and manage order preparation status.
 */

interface KanbanBoardProps {
  /** All orders grouped by status */
  orders: {
    pending: OrderCardData[];
    inProgress: OrderCardData[];
    ready: OrderCardData[];
  };
  /** Callback when action is triggered on an order */
  onAction: (orderId: string, itemIds: string[], newStatus: OrderItemStatus) => void;
  /** Order IDs currently loading */
  loadingOrderIds: string[];
  /** Translation strings */
  translations: {
    newOrders: string;
    inPrep: string;
    ready: string;
    table: string;
    order: string;
    startPrep: string;
    markReady: string;
    markServed: string;
    allergyWarning: string;
    noOrders: string;
  };
}

export function KanbanBoard({
  orders,
  onAction,
  loadingOrderIds,
  translations: t,
}: KanbanBoardProps) {
  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-4">
      {/* NEW / PENDING Column */}
      <KanbanColumn
        title={t.newOrders}
        orders={orders.pending}
        status="PENDING"
        onAction={onAction}
        loadingOrderIds={loadingOrderIds}
        translations={t}
      />

      {/* IN PREP / IN_PROGRESS Column */}
      <KanbanColumn
        title={t.inPrep}
        orders={orders.inProgress}
        status="IN_PROGRESS"
        onAction={onAction}
        loadingOrderIds={loadingOrderIds}
        translations={t}
      />

      {/* READY Column */}
      <KanbanColumn
        title={t.ready}
        orders={orders.ready}
        status="READY"
        onAction={onAction}
        loadingOrderIds={loadingOrderIds}
        translations={t}
      />
    </div>
  );
}

export default KanbanBoard;
