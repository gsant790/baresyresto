"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "@/lib/trpc/client";
import {
  KanbanBoard,
  PrepConsoleHeader,
  SoundNotification,
  useSoundNotification,
  type OrderCardData,
} from "@/components/features/prep-console";
import type { OrderItemStatus } from "@prisma/client";

/**
 * PrepConsoleClient Component
 *
 * Client-side Kanban preparation console with:
 * - Real-time polling (every 5 seconds)
 * - Sound notifications for new orders
 * - Full-screen optimized view
 * - Status transition handling
 */

interface PrepConsoleClientProps {
  /** Sector code (KITCHEN or BAR) */
  sectorCode: "KITCHEN" | "BAR";
  /** Display name for the sector */
  sectorName: string;
  /** Tenant slug for API calls */
  tenantSlug: string;
  /** Translation strings */
  translations: {
    title: string;
    kitchen: string;
    bar: string;
    newOrders: string;
    inPrep: string;
    ready: string;
    startPrep: string;
    markReady: string;
    markServed: string;
    elapsed: string;
    table: string;
    order: string;
    allergyWarning: string;
    noOrders: string;
    waitstaffNotified: string;
    avgTime: string;
    online: string;
    offline: string;
    logout: string;
  };
}

export function PrepConsoleClient({
  sectorCode,
  sectorName,
  translations: t,
}: PrepConsoleClientProps) {
  const [loadingOrderIds, setLoadingOrderIds] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const previousPendingCount = useRef<number>(0);

  // Sound notification hook
  const playNotification = useSoundNotification({
    enabled: soundEnabled,
    volume: 0.5,
  });

  // Fetch order items for this sector with 5-second polling
  const {
    data,
    refetch,
    isRefetching,
  } = api.orders.getItemsBySector.useQuery(
    { sectorCode, statuses: ["PENDING", "IN_PROGRESS", "READY"] },
    {
      refetchInterval: 5000, // Poll every 5 seconds
      refetchOnWindowFocus: true,
    }
  );

  // Update last updated timestamp on successful fetch
  useEffect(() => {
    if (data) {
      setLastUpdated(new Date());

      // Check for new pending orders and play notification
      const currentPendingCount = data.pending.length;
      if (
        previousPendingCount.current > 0 &&
        currentPendingCount > previousPendingCount.current
      ) {
        playNotification();
      }
      previousPendingCount.current = currentPendingCount;
    }
  }, [data, playNotification]);

  // Bulk update mutation
  const bulkUpdateMutation = api.orders.bulkUpdateItemStatus.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Transform data for KanbanBoard
  const transformOrders = useCallback(
    (orders: typeof data): {
      pending: OrderCardData[];
      inProgress: OrderCardData[];
      ready: OrderCardData[];
    } => {
      if (!orders) {
        return { pending: [], inProgress: [], ready: [] };
      }

      const transform = (
        group: (typeof orders)["pending"]
      ): OrderCardData[] => {
        return group.map((order) => ({
          orderId: order.orderId,
          orderNumber: order.orderNumber,
          tableNumber: order.tableNumber,
          tableName: order.tableName,
          createdAt: order.createdAt,
          customerNotes: order.customerNotes,
          status: order.status,
          items: order.items.map((item) => ({
            id: item.id,
            dishId: item.dishId,
            dishName: item.dishName,
            dishNameEn: item.dishNameEn,
            quantity: item.quantity,
            notes: item.notes,
            status: item.status,
            allergens: item.allergens,
          })),
        }));
      };

      return {
        pending: transform(orders.pending),
        inProgress: transform(orders.inProgress),
        ready: transform(orders.ready),
      };
    },
    []
  );

  const orders = transformOrders(data);

  // Calculate stats
  const stats = {
    pending: orders.pending.length,
    inProgress: orders.inProgress.length,
    ready: orders.ready.length,
  };

  // Handle status action
  const handleAction = async (
    orderId: string,
    itemIds: string[],
    newStatus: OrderItemStatus
  ) => {
    // Add to loading state
    setLoadingOrderIds((prev) => [...prev, orderId]);

    try {
      // Only handle valid prep console transitions
      if (
        newStatus === "IN_PROGRESS" ||
        newStatus === "READY" ||
        newStatus === "SERVED"
      ) {
        await bulkUpdateMutation.mutateAsync({
          itemIds,
          status: newStatus,
        });
      }
    } finally {
      // Remove from loading state
      setLoadingOrderIds((prev) => prev.filter((id) => id !== orderId));
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-6">
      {/* Header */}
      <PrepConsoleHeader
        sectorName={sectorName}
        sectorCode={sectorCode}
        stats={stats}
        lastUpdated={lastUpdated}
        isRefetching={isRefetching}
        translations={{
          title: t.title,
          newOrders: t.newOrders,
          inPrep: t.inPrep,
          ready: t.ready,
          avgTime: t.avgTime,
          online: t.online,
          offline: t.offline,
          logout: t.logout,
        }}
      />

      {/* Sound toggle in header */}
      <div className="absolute top-4 right-6 z-20">
        <SoundNotification
          enabled={soundEnabled}
          onToggle={() => setSoundEnabled(!soundEnabled)}
        />
      </div>

      {/* Kanban Board */}
      <main className="flex-1 overflow-hidden p-6">
        <KanbanBoard
          orders={orders}
          onAction={handleAction}
          loadingOrderIds={loadingOrderIds}
          translations={{
            newOrders: t.newOrders,
            inPrep: t.inPrep,
            ready: t.ready,
            table: t.table,
            order: t.order,
            startPrep: t.startPrep,
            markReady: t.markReady,
            markServed: t.markServed,
            allergyWarning: t.allergyWarning,
            noOrders: t.noOrders,
          }}
        />
      </main>
    </div>
  );
}

export default PrepConsoleClient;
