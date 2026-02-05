/**
 * Prep Console Component Showcase
 *
 * Demonstrates all prep console components with various states and configurations.
 * Useful for testing, documentation, and visual verification.
 */

"use client";

import { useState, useMemo } from "react";
import {
  PrepConsoleHeader,
  OrderCard,
  AllergyBadge,
  TicketItem,
  ElapsedTimer,
  SoundNotification,
  useSoundNotification,
  type OrderCardData,
  type OrderCardItem,
} from "./index";
import type { OrderItemStatus } from "@prisma/client";

export function PrepConsoleShowcase() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const playNotification = useSoundNotification({ enabled: soundEnabled, volume: 0.6 });

  // Memoize timestamps - eslint-disable needed for demo timestamps
  const timestamps = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity -- Demo file needs dynamic timestamps
    const now = Date.now();
    return {
      twoMinAgo: new Date(now - 2 * 60 * 1000),
      fiveMinAgo: new Date(now - 5 * 60 * 1000),
      sevenMinAgo: new Date(now - 7 * 60 * 1000),
      twelveMinAgo: new Date(now - 12 * 60 * 1000),
    };
  }, []);

  // Sample order items
  const sampleItems: OrderCardItem[] = [
    {
      id: "item-1",
      dishId: "dish-1",
      dishName: "Hamburguesa Clásica",
      quantity: 2,
      notes: "Sin cebolla, extra queso",
      status: "PENDING" as OrderItemStatus,
      allergens: ["gluten", "dairy"],
    },
    {
      id: "item-2",
      dishId: "dish-2",
      dishName: "Patatas Fritas",
      quantity: 1,
      status: "PENDING" as OrderItemStatus,
      allergens: [],
    },
    {
      id: "item-3",
      dishId: "dish-3",
      dishName: "Ensalada César",
      quantity: 1,
      notes: "Aderezo aparte",
      status: "PENDING" as OrderItemStatus,
      allergens: ["fish", "dairy", "eggs"],
    },
  ];

  // Sample orders with different time urgencies
  const orderRecent: OrderCardData = {
    orderId: "ord-1",
    orderNumber: 8921,
    tableNumber: 4,
    tableName: "Mesa 4",
    createdAt: timestamps.twoMinAgo,
    items: sampleItems.slice(0, 2),
    status: "PENDING" as OrderItemStatus,
  };

  const orderWarning: OrderCardData = {
    orderId: "ord-2",
    orderNumber: 8920,
    tableNumber: 7,
    createdAt: timestamps.sevenMinAgo,
    items: [sampleItems[2]],
    status: "IN_PROGRESS" as OrderItemStatus,
  };

  const orderUrgent: OrderCardData = {
    orderId: "ord-3",
    orderNumber: 8919,
    tableNumber: 12,
    createdAt: timestamps.twelveMinAgo,
    customerNotes: "Cliente tiene prisa, evento importante",
    items: sampleItems,
    status: "IN_PROGRESS" as OrderItemStatus,
  };

  const handleAction = (orderId: string, itemIds: string[], newStatus: OrderItemStatus) => {
    console.log("Action:", { orderId, itemIds, newStatus });
    playNotification();
  };

  const handleLogout = () => {
    console.log("Logout");
  };

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
    <div className="min-h-screen bg-background-dark p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-white mb-8">
          Prep Console Component Showcase
        </h1>

        {/* Header Examples */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">1. PrepConsoleHeader</h2>

          {/* Kitchen Header - Online */}
          <div className="border border-separator rounded-xl overflow-hidden">
            <PrepConsoleHeader
              sectorName="Cocina Principal"
              sectorCode="KITCHEN"
              stats={{ pending: 3, inProgress: 2, ready: 1 }}
              avgTicketTime={420}
              isOnline={true}
              latency={45}
              onLogout={handleLogout}
              translations={translations}
            />
          </div>

          {/* Bar Header - High Latency */}
          <div className="border border-separator rounded-xl overflow-hidden">
            <PrepConsoleHeader
              sectorName="Bar Principal"
              sectorCode="BAR"
              stats={{ pending: 1, inProgress: 4, ready: 2 }}
              avgTicketTime={180}
              isOnline={true}
              latency={450}
              onLogout={handleLogout}
              translations={{ ...translations, title: "Consola de Bar" }}
            />
          </div>

          {/* Offline State */}
          <div className="border border-separator rounded-xl overflow-hidden">
            <PrepConsoleHeader
              sectorName="Cocina Principal"
              sectorCode="KITCHEN"
              stats={{ pending: 0, inProgress: 0, ready: 0 }}
              isOnline={false}
              translations={translations}
            />
          </div>
        </section>

        {/* Order Cards Examples */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">2. OrderCard (Different States)</h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Recent order */}
            <div>
              <p className="text-sm text-text-secondary mb-2">Recent (2 min - Green)</p>
              <OrderCard
                order={orderRecent}
                onAction={handleAction}
                translations={translations}
              />
            </div>

            {/* Warning state */}
            <div>
              <p className="text-sm text-text-secondary mb-2">Warning (7 min - Orange)</p>
              <OrderCard
                order={orderWarning}
                onAction={handleAction}
                translations={translations}
              />
            </div>

            {/* Urgent state */}
            <div>
              <p className="text-sm text-text-secondary mb-2">Urgent (12 min - Red Pulsing)</p>
              <OrderCard
                order={orderUrgent}
                onAction={handleAction}
                translations={translations}
              />
            </div>
          </div>

          {/* Loading state */}
          <div className="max-w-sm">
            <p className="text-sm text-text-secondary mb-2">Loading State</p>
            <OrderCard
              order={orderRecent}
              onAction={handleAction}
              isLoading={true}
              translations={translations}
            />
          </div>
        </section>

        {/* Allergy Badge Examples */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">3. AllergyBadge</h2>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-text-secondary mb-2">Full Display</p>
              <AllergyBadge allergens={["gluten", "dairy", "nuts", "shellfish"]} />
            </div>

            <div>
              <p className="text-sm text-text-secondary mb-2">Single Allergen</p>
              <AllergyBadge allergens={["fish"]} />
            </div>

            <div className="flex items-center gap-3">
              <p className="text-sm text-text-secondary">Compact Mode</p>
              <AllergyBadge allergens={["gluten", "dairy", "nuts"]} compact />
              <AllergyBadge allergens={["eggs"]} compact />
            </div>
          </div>
        </section>

        {/* Ticket Item Examples */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">4. TicketItem</h2>

          <div className="bg-card-dark p-4 rounded-lg space-y-3 max-w-md">
            <TicketItem
              quantity={2}
              name="Hamburguesa Clásica"
              notes="Sin cebolla, extra queso"
              allergens={["gluten", "dairy"]}
            />

            <TicketItem
              quantity={1}
              name="Ensalada César"
              notes="Aderezo aparte"
              allergens={["fish", "dairy", "eggs"]}
            />

            <TicketItem
              quantity={3}
              name="Patatas Fritas"
            />

            <div className="pt-3 border-t border-separator">
              <p className="text-sm text-text-secondary mb-2">Compact Mode</p>
              <TicketItem
                quantity={1}
                name="Café Americano"
                compact
              />
            </div>
          </div>
        </section>

        {/* Elapsed Timer Examples */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">5. ElapsedTimer</h2>

          <div className="bg-card-dark p-6 rounded-lg space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-text-secondary w-32">Normal (2 min):</span>
              <ElapsedTimer startTime={timestamps.twoMinAgo} large />
            </div>

            <div className="flex items-center gap-4">
              <span className="text-text-secondary w-32">Warning (7 min):</span>
              <ElapsedTimer startTime={timestamps.sevenMinAgo} large />
            </div>

            <div className="flex items-center gap-4">
              <span className="text-text-secondary w-32">Urgent (12 min):</span>
              <ElapsedTimer startTime={timestamps.twelveMinAgo} large />
            </div>

            <div className="flex items-center gap-4">
              <span className="text-text-secondary w-32">Small size:</span>
              <ElapsedTimer startTime={timestamps.fiveMinAgo} />
            </div>
          </div>
        </section>

        {/* Sound Notification */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">6. SoundNotification</h2>

          <div className="bg-card-dark p-6 rounded-lg space-y-4">
            <div className="flex items-center gap-4">
              <SoundNotification
                enabled={soundEnabled}
                onToggle={() => setSoundEnabled(!soundEnabled)}
              />
              <span className="text-text-secondary">
                Sound is {soundEnabled ? "enabled" : "disabled"}
              </span>
            </div>

            <button
              type="button"
              onClick={playNotification}
              className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90"
            >
              Test Sound
            </button>
          </div>
        </section>

        {/* Color Reference */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">7. Status Colors</h2>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-card-dark p-4 rounded-lg border-l-4 border-l-blue-500">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-blue-400 font-bold">NEW / PENDING</span>
              </div>
              <p className="text-xs text-text-muted">Blue (#3b82f6)</p>
            </div>

            <div className="bg-card-dark p-4 rounded-lg border-l-4 border-l-orange-500">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-orange-400 font-bold">IN PREP</span>
              </div>
              <p className="text-xs text-text-muted">Orange (#f59e0b)</p>
            </div>

            <div className="bg-card-dark p-4 rounded-lg border-l-4 border-l-green-500">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-green-400 font-bold">READY</span>
              </div>
              <p className="text-xs text-text-muted">Green (#22c55e)</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default PrepConsoleShowcase;
