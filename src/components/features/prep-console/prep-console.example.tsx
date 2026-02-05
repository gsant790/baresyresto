/**
 * PrepConsole Usage Example
 *
 * This file demonstrates how to use the prep console components
 * to create a complete kitchen or bar preparation interface.
 */

"use client";

import { useState, useMemo } from "react";
import {
  PrepConsoleHeader,
  KanbanBoard,
  type OrderCardData,
} from "./index";
import type { OrderItemStatus } from "@prisma/client";

export function PrepConsoleExample() {
  // Mock state for demonstration
  const [loadingOrderIds, setLoadingOrderIds] = useState<string[]>([]);

  // Example orders data - memoized to avoid impure render
  const mockOrders = useMemo<{
    pending: OrderCardData[];
    inProgress: OrderCardData[];
    ready: OrderCardData[];
  }>(() => {
    // eslint-disable-next-line react-hooks/purity -- Demo file needs dynamic timestamps
    const now = Date.now();
    return {
      pending: [
        {
          orderId: "ord-001",
          orderNumber: 8921,
          tableNumber: 4,
          tableName: "Mesa 4",
          createdAt: new Date(now - 2 * 60 * 1000), // 2 minutes ago
          items: [
            {
              id: "item-001",
              dishId: "dish-001",
              dishName: "Hamburguesa Clásica",
              quantity: 2,
              notes: "Sin cebolla, extra queso",
              status: "PENDING" as OrderItemStatus,
              allergens: ["gluten", "dairy"],
            },
            {
              id: "item-002",
              dishId: "dish-002",
              dishName: "Patatas Fritas",
              quantity: 1,
              status: "PENDING" as OrderItemStatus,
              allergens: [],
            },
          ],
          status: "PENDING" as OrderItemStatus,
        },
      ],
      inProgress: [
        {
          orderId: "ord-002",
          orderNumber: 8920,
          tableNumber: 7,
          createdAt: new Date(now - 8 * 60 * 1000), // 8 minutes ago
          items: [
            {
              id: "item-003",
              dishId: "dish-003",
              dishName: "Ensalada César",
              quantity: 1,
              status: "IN_PROGRESS" as OrderItemStatus,
              allergens: ["fish", "dairy", "eggs"],
            },
          ],
          status: "IN_PROGRESS" as OrderItemStatus,
        },
      ],
      ready: [],
    };
  }, []);

  // Example stats
  const stats = {
    pending: mockOrders.pending.length,
    inProgress: mockOrders.inProgress.length,
    ready: mockOrders.ready.length,
  };

  // Handle status change
  const handleAction = async (
    orderId: string,
    itemIds: string[],
    newStatus: OrderItemStatus
  ) => {
    setLoadingOrderIds((prev) => [...prev, orderId]);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // In a real app, you would update the order status via API
    console.log("Update order:", { orderId, itemIds, newStatus });

    setLoadingOrderIds((prev) => prev.filter((id) => id !== orderId));
  };

  // Handle logout
  const handleLogout = () => {
    console.log("Logout clicked");
    // Implement logout logic
  };

  // Translation strings (should come from i18n in real app)
  const translations = {
    title: "Consola de Cocina",
    newOrders: "Nuevos",
    inPrep: "En Prep",
    ready: "Listos",
    table: "Mesa",
    order: "Pedido",
    startPrep: "Iniciar →",
    markReady: "Marcar Listo",
    markServed: "Servido",
    allergyWarning: "Alergias",
    noOrders: "No hay pedidos",
    avgTime: "Tiempo Promedio",
    online: "En línea",
    offline: "Desconectado",
    logout: "Salir",
  };

  return (
    <div className="min-h-screen bg-background-dark">
      {/* Header */}
      <PrepConsoleHeader
        sectorName="Cocina Principal"
        sectorCode="KITCHEN"
        stats={stats}
        avgTicketTime={420} // 7 minutes in seconds
        isOnline={true}
        latency={45}
        onLogout={handleLogout}
        lastUpdated={new Date()}
        isRefetching={false}
        translations={translations}
      />

      {/* Main Content - Kanban Board */}
      <main className="p-6 h-[calc(100vh-100px)]">
        <KanbanBoard
          orders={mockOrders}
          onAction={handleAction}
          loadingOrderIds={loadingOrderIds}
          translations={translations}
        />
      </main>
    </div>
  );
}

export default PrepConsoleExample;
