"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * OrdersPageClient Component
 *
 * Client-side orders management interface.
 * Displays orders in a list with filtering by status.
 */

interface OrderItem {
  id: string;
  orderId: string;
  dishId: string;
  prepSectorId: string;
  quantity: number;
  unitPrice: number;
  notes: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  dish: {
    id: string;
    name: string;
  };
}

interface Order {
  id: string;
  tenantId: string;
  tableId: string;
  orderNumber: number;
  status: string;
  customerNotes: string | null;
  subtotal: number;
  vatAmount: number;
  tipAmount: number;
  total: number;
  createdById: string | null;
  closedById: string | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  table: {
    id: string;
    number: number;
    name: string | null;
    zone: string | null;
  };
  items: OrderItem[];
  createdBy: {
    id: string;
    name: string;
  } | null;
}

interface OrdersPageClientProps {
  initialOrders: Order[];
  stats: {
    total: number;
    pending: number;
    confirmed: number;
    inProgress: number;
    ready: number;
    delivered: number;
    paid: number;
    cancelled: number;
  };
  tenantSlug: string;
  locale: string;
  translations: {
    title: string;
    newOrder: string;
    orderNumber: string;
    table: string;
    total: string;
    subtotal: string;
    vat: string;
    tip: string;
    status: {
      pending: string;
      confirmed: string;
      inProgress: string;
      ready: string;
      delivered: string;
      paid: string;
      cancelled: string;
    };
    search: string;
    filter: string;
    noResults: string;
  };
}

type OrderStatusFilter = "all" | "active" | "completed" | "cancelled";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  CONFIRMED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  IN_PROGRESS: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  READY: "bg-green-500/20 text-green-400 border-green-500/30",
  DELIVERED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  PAID: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  CANCELLED: "bg-red-500/20 text-red-400 border-red-500/30",
};

export function OrdersPageClient({
  initialOrders,
  stats,
  translations: t,
}: OrdersPageClientProps) {
  const [filter, setFilter] = useState<OrderStatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter orders based on status filter and search query
  const filteredOrders = initialOrders.filter((order) => {
    // Apply status filter
    if (filter === "active") {
      if (["PAID", "CANCELLED"].includes(order.status)) return false;
    } else if (filter === "completed") {
      if (order.status !== "PAID") return false;
    } else if (filter === "cancelled") {
      if (order.status !== "CANCELLED") return false;
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesOrderNumber = order.orderNumber.toString().includes(query);
      const matchesTable = order.table.number.toString().includes(query);
      return matchesOrderNumber || matchesTable;
    }

    return true;
  });

  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      PENDING: t.status.pending,
      CONFIRMED: t.status.confirmed,
      IN_PROGRESS: t.status.inProgress,
      READY: t.status.ready,
      DELIVERED: t.status.delivered,
      PAID: t.status.paid,
      CANCELLED: t.status.cancelled,
    };
    return statusMap[status] || status;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary-dark tracking-tight">
            {t.title}
          </h1>
          <p className="text-text-secondary mt-1">
            {stats.total} orders total, {stats.pending + stats.confirmed + stats.inProgress + stats.ready + stats.delivered} active
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-card-dark rounded-xl border border-separator p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">
              {t.status.pending}
            </span>
            <span className="w-3 h-3 rounded-full bg-yellow-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-text-primary-dark">
            {stats.pending}
          </p>
        </div>

        <div className="bg-card-dark rounded-xl border border-separator p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">
              {t.status.confirmed}
            </span>
            <span className="w-3 h-3 rounded-full bg-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-text-primary-dark">
            {stats.confirmed}
          </p>
        </div>

        <div className="bg-card-dark rounded-xl border border-separator p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">
              {t.status.inProgress}
            </span>
            <span className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
          </div>
          <p className="mt-2 text-2xl font-bold text-text-primary-dark">
            {stats.inProgress}
          </p>
        </div>

        <div className="bg-card-dark rounded-xl border border-separator p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">
              {t.status.ready}
            </span>
            <span className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-text-primary-dark">
            {stats.ready}
          </p>
        </div>

        <div className="bg-card-dark rounded-xl border border-separator p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">
              {t.status.delivered}
            </span>
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-text-primary-dark">
            {stats.delivered}
          </p>
        </div>

        <div className="bg-card-dark rounded-xl border border-separator p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">
              {t.status.paid}
            </span>
            <span className="w-3 h-3 rounded-full bg-purple-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-text-primary-dark">
            {stats.paid}
          </p>
        </div>

        <div className="bg-card-dark rounded-xl border border-separator p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">
              {t.status.cancelled}
            </span>
            <span className="w-3 h-3 rounded-full bg-red-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-text-primary-dark">
            {stats.cancelled}
          </p>
        </div>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Status filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {(["all", "active", "completed", "cancelled"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                filter === f
                  ? "bg-primary text-white"
                  : "bg-surface-dark border border-separator text-text-secondary hover:text-text-primary-dark hover:bg-hover-row"
              )}
            >
              {f === "all" && "All"}
              {f === "active" && "Active"}
              {f === "completed" && "Completed"}
              {f === "cancelled" && "Cancelled"}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              search
            </span>
            <input
              type="text"
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full pl-10 pr-4 py-2 rounded-lg",
                "bg-surface-dark border border-separator",
                "text-text-primary-dark placeholder:text-text-muted",
                "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              )}
            />
          </div>
        </div>
      </div>

      {/* Orders list */}
      <div className="bg-card-dark rounded-xl border border-separator overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-text-muted mb-4">
              receipt_long
            </span>
            <p className="text-text-secondary">{t.noResults}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-separator bg-surface-dark">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">
                    {t.orderNumber}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">
                    {t.table}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">
                    Items
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-text-secondary">
                    {t.total}
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-text-secondary">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-separator">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-hover-row transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-text-primary-dark">
                        #{order.orderNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-text-muted text-sm">
                          table_restaurant
                        </span>
                        <span className="text-text-primary-dark">
                          {t.table} {order.table.number}
                        </span>
                        {order.table.zone && (
                          <span className="text-xs text-text-muted">
                            ({order.table.zone})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-text-secondary">
                        {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex px-3 py-1 rounded-full text-xs font-medium border",
                          STATUS_COLORS[order.status] || "bg-gray-500/20 text-gray-400"
                        )}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-text-primary-dark">
                        {formatCurrency(order.total)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-text-secondary text-sm">
                        {formatDate(order.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrdersPageClient;
