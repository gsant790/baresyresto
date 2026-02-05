"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * PaymentsPageClient Component
 *
 * Client-side payments management interface.
 * Displays payments in a list with filtering by status and method.
 */

interface Payment {
  id: string;
  tenantId: string;
  orderId: string;
  method: string;
  status: string;
  amount: number;
  bizumReference: string | null;
  receiptUrl: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  order: {
    id: string;
    orderNumber: number;
    total: number;
    table: {
      id: string;
      number: number;
      name: string | null;
    };
  };
}

interface PaymentsPageClientProps {
  initialPayments: Payment[];
  stats: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    refunded: number;
  };
  totalsByMethod: {
    cash: number;
    card: number;
    bizum: number;
  };
  tenantSlug: string;
  locale: string;
  translations: {
    title: string;
    total: string;
    methods: {
      cash: string;
      card: string;
      bizum: string;
    };
    status: {
      pending: string;
      processing: string;
      completed: string;
      failed: string;
      refunded: string;
    };
    search: string;
    filter: string;
    noResults: string;
  };
}

type PaymentStatusFilter = "all" | "completed" | "pending" | "failed";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  PROCESSING: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  COMPLETED: "bg-green-500/20 text-green-400 border-green-500/30",
  FAILED: "bg-red-500/20 text-red-400 border-red-500/30",
  REFUNDED: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const METHOD_ICONS: Record<string, string> = {
  CASH: "payments",
  CARD: "credit_card",
  BIZUM: "smartphone",
};

export function PaymentsPageClient({
  initialPayments,
  stats,
  totalsByMethod,
  translations: t,
}: PaymentsPageClientProps) {
  const [filter, setFilter] = useState<PaymentStatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter payments based on status filter and search query
  const filteredPayments = initialPayments.filter((payment) => {
    // Apply status filter
    if (filter === "completed" && payment.status !== "COMPLETED") return false;
    if (filter === "pending" && !["PENDING", "PROCESSING"].includes(payment.status)) return false;
    if (filter === "failed" && !["FAILED", "REFUNDED"].includes(payment.status)) return false;

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesOrderNumber = payment.order.orderNumber.toString().includes(query);
      const matchesTable = payment.order.table.number.toString().includes(query);
      const matchesBizum = payment.bizumReference?.toLowerCase().includes(query);
      return matchesOrderNumber || matchesTable || matchesBizum;
    }

    return true;
  });

  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      PENDING: t.status.pending,
      PROCESSING: t.status.processing,
      COMPLETED: t.status.completed,
      FAILED: t.status.failed,
      REFUNDED: t.status.refunded,
    };
    return statusMap[status] || status;
  };

  const getMethodLabel = (method: string): string => {
    const methodMap: Record<string, string> = {
      CASH: t.methods.cash,
      CARD: t.methods.card,
      BIZUM: t.methods.bizum,
    };
    return methodMap[method] || method;
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

  const totalRevenue = totalsByMethod.cash + totalsByMethod.card + totalsByMethod.bizum;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary-dark tracking-tight">
            {t.title}
          </h1>
          <p className="text-text-secondary mt-1">
            {stats.total} payments total, {formatCurrency(totalRevenue)} revenue
          </p>
        </div>
      </div>

      {/* Revenue by method cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card-dark rounded-xl border border-separator p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">
              {t.methods.cash}
            </span>
            <span className="material-symbols-outlined text-green-400">
              payments
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold text-text-primary-dark">
            {formatCurrency(totalsByMethod.cash)}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            {initialPayments.filter((p) => p.method === "CASH" && p.status === "COMPLETED").length} transactions
          </p>
        </div>

        <div className="bg-card-dark rounded-xl border border-separator p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">
              {t.methods.card}
            </span>
            <span className="material-symbols-outlined text-blue-400">
              credit_card
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold text-text-primary-dark">
            {formatCurrency(totalsByMethod.card)}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            {initialPayments.filter((p) => p.method === "CARD" && p.status === "COMPLETED").length} transactions
          </p>
        </div>

        <div className="bg-card-dark rounded-xl border border-separator p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">
              {t.methods.bizum}
            </span>
            <span className="material-symbols-outlined text-purple-400">
              smartphone
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold text-text-primary-dark">
            {formatCurrency(totalsByMethod.bizum)}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            {initialPayments.filter((p) => p.method === "BIZUM" && p.status === "COMPLETED").length} transactions
          </p>
        </div>
      </div>

      {/* Status stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
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
              {t.status.processing}
            </span>
            <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
          </div>
          <p className="mt-2 text-2xl font-bold text-text-primary-dark">
            {stats.processing}
          </p>
        </div>

        <div className="bg-card-dark rounded-xl border border-separator p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">
              {t.status.completed}
            </span>
            <span className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-text-primary-dark">
            {stats.completed}
          </p>
        </div>

        <div className="bg-card-dark rounded-xl border border-separator p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">
              {t.status.failed}
            </span>
            <span className="w-3 h-3 rounded-full bg-red-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-text-primary-dark">
            {stats.failed}
          </p>
        </div>

        <div className="bg-card-dark rounded-xl border border-separator p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">
              {t.status.refunded}
            </span>
            <span className="w-3 h-3 rounded-full bg-purple-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-text-primary-dark">
            {stats.refunded}
          </p>
        </div>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Status filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {(["all", "completed", "pending", "failed"] as const).map((f) => (
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
              {f === "completed" && "Completed"}
              {f === "pending" && "Pending"}
              {f === "failed" && "Failed"}
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

      {/* Payments list */}
      <div className="bg-card-dark rounded-xl border border-separator overflow-hidden">
        {filteredPayments.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-text-muted mb-4">
              payments
            </span>
            <p className="text-text-secondary">{t.noResults}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-separator bg-surface-dark">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">
                    Order
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">
                    Table
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">
                    Method
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-text-secondary">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-text-secondary">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-separator">
                {filteredPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="hover:bg-hover-row transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-text-primary-dark">
                        #{payment.order.orderNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-text-muted text-sm">
                          table_restaurant
                        </span>
                        <span className="text-text-primary-dark">
                          Table {payment.order.table.number}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-text-muted text-sm">
                          {METHOD_ICONS[payment.method] || "payment"}
                        </span>
                        <span className="text-text-primary-dark">
                          {getMethodLabel(payment.method)}
                        </span>
                        {payment.bizumReference && (
                          <span className="text-xs text-text-muted">
                            ({payment.bizumReference})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex px-3 py-1 rounded-full text-xs font-medium border",
                          STATUS_COLORS[payment.status] || "bg-gray-500/20 text-gray-400"
                        )}
                      >
                        {getStatusLabel(payment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-text-primary-dark">
                        {formatCurrency(payment.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-text-secondary text-sm">
                        {formatDate(payment.paidAt || payment.createdAt)}
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

export default PaymentsPageClient;
