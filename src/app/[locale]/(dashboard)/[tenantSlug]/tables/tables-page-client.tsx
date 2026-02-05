"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Table } from "@prisma/client";
import { cn } from "@/lib/utils";
import { api } from "@/lib/trpc/client";
import {
  TablesGrid,
  TableForm,
  QRPrintSheet,
  type TableFormData,
} from "@/components/features/tables";

/**
 * TablesPageClient Component
 *
 * Client-side tables management interface.
 * Handles creating tables, viewing QR codes, and printing QR sheets.
 */

interface TablesPageClientProps {
  initialTables: Table[];
  stats: {
    available: number;
    occupied: number;
    reserved: number;
    cleaning: number;
    total: number;
  };
  tenantSlug: string;
  tenantName: string;
  translations: {
    title: string;
    addTable: string;
    tableNumber: string;
    capacity: string;
    zone: string;
    qrCode: string;
    status: {
      available: string;
      occupied: string;
      reserved: string;
      cleaning: string;
    };
  };
}

type ModalState = "none" | "create" | "print";

export function TablesPageClient({
  initialTables,
  stats: initialStats,
  tenantSlug,
  tenantName,
  translations: t,
}: TablesPageClientProps) {
  const router = useRouter();
  const [modalState, setModalState] = useState<ModalState>("none");
  const [selectedTables, setSelectedTables] = useState<Table[]>([]);

  // Use tRPC query with initial data
  const {
    data: tables = initialTables,
    refetch,
  } = api.tables.list.useQuery(undefined, {
    initialData: initialTables,
  });

  // Calculate stats from current tables
  const stats = {
    available: tables.filter((t) => t.status === "AVAILABLE").length,
    occupied: tables.filter((t) => t.status === "OCCUPIED").length,
    reserved: tables.filter((t) => t.status === "RESERVED").length,
    cleaning: tables.filter((t) => t.status === "CLEANING").length,
    total: tables.length,
  };

  // Create table mutation
  const createMutation = api.tables.create.useMutation({
    onSuccess: () => {
      setModalState("none");
      refetch();
    },
  });

  const handleTableClick = (table: Table) => {
    router.push(`/${tenantSlug}/tables/${table.id}`);
  };

  const handleCreateSubmit = (data: TableFormData) => {
    createMutation.mutate(data);
  };

  const handlePrintAll = () => {
    setSelectedTables(tables);
    setModalState("print");
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
            {stats.total} table{stats.total !== 1 ? "s" : ""} total,{" "}
            {stats.available} available
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Print all QR codes button */}
          {tables.length > 0 && (
            <button
              type="button"
              onClick={handlePrintAll}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm",
                "bg-surface-dark border border-separator text-text-secondary",
                "hover:bg-hover-row hover:text-text-primary-dark"
              )}
            >
              <span className="material-symbols-outlined text-lg">
                qr_code_2
              </span>
              Print QR Codes
            </button>
          )}

          {/* Add table button */}
          <button
            type="button"
            onClick={() => setModalState("create")}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm",
              "bg-primary text-white",
              "hover:bg-primary-dark",
              "shadow-lg shadow-primary/20"
            )}
          >
            <span className="material-symbols-outlined text-lg">add</span>
            {t.addTable}
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card-dark rounded-xl border border-separator p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">
              {t.status.available}
            </span>
            <span className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-text-primary-dark">
            {stats.available}
          </p>
        </div>

        <div className="bg-card-dark rounded-xl border border-separator p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">
              {t.status.occupied}
            </span>
            <span className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
          </div>
          <p className="mt-2 text-2xl font-bold text-text-primary-dark">
            {stats.occupied}
          </p>
        </div>

        <div className="bg-card-dark rounded-xl border border-separator p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">
              {t.status.reserved}
            </span>
            <span className="w-3 h-3 rounded-full bg-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-text-primary-dark">
            {stats.reserved}
          </p>
        </div>

        <div className="bg-card-dark rounded-xl border border-separator p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">
              {t.status.cleaning}
            </span>
            <span className="w-3 h-3 rounded-full bg-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-text-primary-dark">
            {stats.cleaning}
          </p>
        </div>
      </div>

      {/* Tables grid */}
      <div className="bg-card-dark rounded-xl border border-separator p-6">
        <TablesGrid tables={tables} onTableClick={handleTableClick} />
      </div>

      {/* Create table modal */}
      {modalState === "create" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setModalState("none")}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md bg-surface-dark rounded-xl border border-separator shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-separator">
              <h2 className="text-lg font-semibold text-text-primary-dark">
                {t.addTable}
              </h2>
              <button
                type="button"
                onClick={() => setModalState("none")}
                className="p-1 text-text-muted hover:text-text-primary-dark rounded-lg hover:bg-hover-row"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6">
              <TableForm
                onSubmit={handleCreateSubmit}
                onCancel={() => setModalState("none")}
                isLoading={createMutation.isPending}
              />
            </div>

            {createMutation.error && (
              <div className="px-6 pb-6">
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-400">
                    {createMutation.error.message}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Print QR codes modal */}
      {modalState === "print" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-auto">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setModalState("none")}
          />

          {/* Modal */}
          <div className="relative w-full max-w-4xl bg-surface-dark rounded-xl border border-separator shadow-2xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-separator print:hidden">
              <h2 className="text-lg font-semibold text-text-primary-dark">
                Print QR Codes
              </h2>
              <button
                type="button"
                onClick={() => setModalState("none")}
                className="p-1 text-text-muted hover:text-text-primary-dark rounded-lg hover:bg-hover-row"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6">
              <QRPrintSheet
                tables={selectedTables}
                tenantSlug={tenantSlug}
                tenantName={tenantName}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TablesPageClient;
