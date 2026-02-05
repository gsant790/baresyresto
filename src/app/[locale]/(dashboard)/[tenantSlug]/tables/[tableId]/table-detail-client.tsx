"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { type Table, TableStatus, type PaymentMethod } from "@prisma/client";
import { cn } from "@/lib/utils";
import { api } from "@/lib/trpc/client";
import { QRDisplay, TableForm, type TableFormData } from "@/components/features/tables";
import { CloseTableModal } from "@/components/features/payments";

/**
 * TableDetailClient Component
 *
 * Client-side table detail view with actions.
 * Allows viewing, editing, updating status, closing table, and deleting a table.
 */

interface TableDetailClientProps {
  table: Table;
  menuUrl: string;
  tenantSlug: string;
  locale: string;
  currency?: string;
  translations: {
    title: string;
    tableNumber: string;
    capacity: string;
    zone: string;
    qrCode: string;
    closeTable: string;
    status: {
      available: string;
      occupied: string;
      reserved: string;
      cleaning: string;
    };
    edit: string;
    delete: string;
    save: string;
    cancel: string;
    back: string;
  };
  paymentTranslations: {
    title: string;
    closeTable: string;
    selectPaymentMethod: string;
    orderSummary: string;
    order: string;
    items: string;
    subtotal: string;
    vat: string;
    tip: string;
    total: string;
    combinedTotal: string;
    confirm: string;
    cancel: string;
    processing: string;
    noOrders: string;
    paymentMethods: {
      cash: string;
      card: string;
      bizum: string;
    };
  };
}

// Status configuration
const statusConfig: Record<TableStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}> = {
  AVAILABLE: {
    label: "Available",
    color: "text-green-400",
    bgColor: "bg-green-500/10 border-green-500/20",
    icon: "check_circle",
  },
  OCCUPIED: {
    label: "Occupied",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10 border-orange-500/20",
    icon: "groups",
  },
  RESERVED: {
    label: "Reserved",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10 border-blue-500/20",
    icon: "event",
  },
  CLEANING: {
    label: "Cleaning",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10 border-amber-500/20",
    icon: "cleaning_services",
  },
};

type ModalState = "none" | "edit" | "delete" | "closeTable";

export function TableDetailClient({
  table: initialTable,
  menuUrl,
  tenantSlug,
  locale,
  currency = "EUR",
  translations: t,
  paymentTranslations: pt,
}: TableDetailClientProps) {
  const router = useRouter();
  const [modalState, setModalState] = useState<ModalState>("none");
  const [closeTableError, setCloseTableError] = useState<string | null>(null);

  // Fetch table with initial data
  const { data: table = initialTable, refetch } = api.tables.getById.useQuery(
    { id: initialTable.id },
    { initialData: initialTable }
  );

  // Fetch active orders for close table modal
  const { data: activeOrdersData, refetch: refetchOrders } = api.orders.getActiveOrdersForTable.useQuery(
    { tableId: table.id },
    { enabled: modalState === "closeTable" }
  );

  // Update mutation
  const updateMutation = api.tables.update.useMutation({
    onSuccess: () => {
      setModalState("none");
      refetch();
    },
  });

  // Update status mutation
  const updateStatusMutation = api.tables.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Delete mutation
  const deleteMutation = api.tables.delete.useMutation({
    onSuccess: () => {
      router.push(`/${locale}/${tenantSlug}/tables`);
    },
  });

  // Regenerate QR mutation
  const regenerateQrMutation = api.tables.regenerateQrCode.useMutation({
    onSuccess: () => {
      refetch();
      // Need to refresh page to get new URL
      router.refresh();
    },
  });

  // Close table mutation
  const closeTableMutation = api.orders.closeTable.useMutation({
    onSuccess: () => {
      setModalState("none");
      setCloseTableError(null);
      refetch();
      refetchOrders();
    },
    onError: (error) => {
      setCloseTableError(error.message);
    },
  });

  const handleStatusChange = (status: TableStatus) => {
    updateStatusMutation.mutate({ id: table.id, status });
  };

  const handleUpdateSubmit = (data: TableFormData) => {
    updateMutation.mutate({
      id: table.id,
      ...data,
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id: table.id });
  };

  const handleRegenerateQr = () => {
    if (confirm("Are you sure you want to regenerate the QR code? The old QR code will stop working.")) {
      regenerateQrMutation.mutate({ id: table.id });
    }
  };

  const handleCloseTable = (paymentMethod: PaymentMethod) => {
    setCloseTableError(null);
    closeTableMutation.mutate({
      tableId: table.id,
      paymentMethod,
    });
  };

  const handleOpenCloseTableModal = () => {
    setCloseTableError(null);
    setModalState("closeTable");
  };

  const currentStatus = statusConfig[table.status];
  const isOccupied = table.status === "OCCUPIED";

  return (
    <div className="space-y-6">
      {/* Back button and header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push(`/${locale}/${tenantSlug}/tables`)}
            className={cn(
              "p-2 rounded-lg",
              "text-text-secondary hover:text-text-primary-dark",
              "hover:bg-hover-row"
            )}
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-text-primary-dark tracking-tight">
              Table {table.number}
            </h1>
            {table.name && (
              <p className="text-text-secondary">{table.name}</p>
            )}
          </div>
        </div>

        {/* Close Table button - only show for occupied tables */}
        {isOccupied && (
          <button
            type="button"
            onClick={handleOpenCloseTableModal}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm",
              "bg-primary text-white",
              "hover:bg-primary-dark",
              "shadow-lg shadow-primary/20",
              "transition-all duration-200"
            )}
          >
            <span className="material-symbols-outlined text-lg">point_of_sale</span>
            {t.closeTable}
          </button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column - Table info and status */}
        <div className="space-y-6">
          {/* Table info card */}
          <div className="bg-card-dark rounded-xl border border-separator p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-text-primary-dark">
                Table Information
              </h2>
              <button
                type="button"
                onClick={() => setModalState("edit")}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium",
                  "text-text-secondary hover:text-text-primary-dark",
                  "hover:bg-hover-row"
                )}
              >
                <span className="material-symbols-outlined text-lg">edit</span>
                {t.edit}
              </button>
            </div>

            <div className="space-y-4">
              {/* Table number */}
              <div className="flex items-center justify-between py-2 border-b border-separator">
                <span className="text-text-secondary">Number</span>
                <span className="text-text-primary-dark font-medium">
                  {table.number}
                </span>
              </div>

              {/* Name */}
              {table.name && (
                <div className="flex items-center justify-between py-2 border-b border-separator">
                  <span className="text-text-secondary">Name</span>
                  <span className="text-text-primary-dark font-medium">
                    {table.name}
                  </span>
                </div>
              )}

              {/* Capacity */}
              <div className="flex items-center justify-between py-2 border-b border-separator">
                <span className="text-text-secondary">{t.capacity}</span>
                <span className="text-text-primary-dark font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-lg">group</span>
                  {table.capacity}
                </span>
              </div>

              {/* Zone */}
              <div className="flex items-center justify-between py-2 border-b border-separator">
                <span className="text-text-secondary">{t.zone}</span>
                <span className="text-text-primary-dark font-medium">
                  {table.zone || "—"}
                </span>
              </div>

              {/* Current status */}
              <div className="flex items-center justify-between py-2">
                <span className="text-text-secondary">Current Status</span>
                <span
                  className={cn(
                    "px-3 py-1 rounded-full text-sm font-medium border",
                    currentStatus.bgColor,
                    currentStatus.color
                  )}
                >
                  {t.status[table.status.toLowerCase() as keyof typeof t.status]}
                </span>
              </div>
            </div>
          </div>

          {/* Status change card */}
          <div className="bg-card-dark rounded-xl border border-separator p-6">
            <h2 className="text-lg font-semibold text-text-primary-dark mb-4">
              Change Status
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(TableStatus) as TableStatus[]).map((status) => {
                const config = statusConfig[status];
                const isActive = table.status === status;

                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleStatusChange(status)}
                    disabled={isActive || updateStatusMutation.isPending}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg text-sm font-medium transition-colors",
                      "border",
                      isActive
                        ? cn(config.bgColor, config.color, "cursor-default")
                        : "border-separator text-text-secondary hover:bg-hover-row hover:text-text-primary-dark",
                      "disabled:opacity-50"
                    )}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {config.icon}
                    </span>
                    {t.status[status.toLowerCase() as keyof typeof t.status]}
                    {isActive && (
                      <span className="material-symbols-outlined text-sm ml-auto">
                        check
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Danger zone */}
          <div className="bg-card-dark rounded-xl border border-red-500/20 p-6">
            <h2 className="text-lg font-semibold text-error mb-2">
              Danger Zone
            </h2>
            <p className="text-sm text-text-secondary mb-4">
              Deleting a table is permanent and cannot be undone.
            </p>
            <button
              type="button"
              onClick={() => setModalState("delete")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                "bg-red-500/10 text-red-400 border border-red-500/20",
                "hover:bg-red-500/20"
              )}
            >
              <span className="material-symbols-outlined text-lg">delete</span>
              Delete Table
            </button>
          </div>
        </div>

        {/* Right column - QR code */}
        <div className="space-y-6">
          {/* QR Code display */}
          <QRDisplay
            url={menuUrl}
            tableNumber={table.number}
            tableName={table.name}
            qrCode={table.qrCode}
            size={250}
          />

          {/* Regenerate QR button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleRegenerateQr}
              disabled={regenerateQrMutation.isPending}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                "bg-surface-dark border border-separator text-text-secondary",
                "hover:bg-hover-row hover:text-text-primary-dark",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {regenerateQrMutation.isPending ? (
                <span className="material-symbols-outlined animate-spin text-lg">
                  progress_activity
                </span>
              ) : (
                <span className="material-symbols-outlined text-lg">refresh</span>
              )}
              Regenerate QR Code
            </button>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {modalState === "edit" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setModalState("none")}
          />
          <div className="relative w-full max-w-md bg-surface-dark rounded-xl border border-separator shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-separator">
              <h2 className="text-lg font-semibold text-text-primary-dark">
                Edit Table
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
                table={table}
                onSubmit={handleUpdateSubmit}
                onCancel={() => setModalState("none")}
                isLoading={updateMutation.isPending}
              />
            </div>
            {updateMutation.error && (
              <div className="px-6 pb-6">
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-400">
                    {updateMutation.error.message}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {modalState === "delete" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setModalState("none")}
          />
          <div className="relative w-full max-w-sm bg-surface-dark rounded-xl border border-separator shadow-2xl">
            <div className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-full bg-red-500/10">
                <span className="material-symbols-outlined text-3xl text-error">
                  delete
                </span>
              </div>
              <h2 className="text-lg font-semibold text-text-primary-dark mb-2">
                Delete Table {table.number}?
              </h2>
              <p className="text-sm text-text-secondary mb-6">
                This action cannot be undone. The table&apos;s QR code will stop working.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setModalState("none")}
                  disabled={deleteMutation.isPending}
                  className={cn(
                    "px-4 py-2 rounded-lg font-medium text-sm",
                    "bg-surface-dark border border-separator text-text-secondary",
                    "hover:bg-hover-row hover:text-text-primary-dark",
                    "disabled:opacity-50"
                  )}
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className={cn(
                    "px-4 py-2 rounded-lg font-bold text-sm",
                    "bg-error text-white",
                    "hover:bg-red-600",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "flex items-center gap-2"
                  )}
                >
                  {deleteMutation.isPending && (
                    <span className="material-symbols-outlined animate-spin text-lg">
                      progress_activity
                    </span>
                  )}
                  {t.delete}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close Table modal */}
      {modalState === "closeTable" && activeOrdersData && (
        <CloseTableModal
          tableNumber={table.number}
          tableName={table.name}
          orders={activeOrdersData.orders}
          combinedTotal={activeOrdersData.combinedTotal}
          onClose={() => setModalState("none")}
          onConfirm={handleCloseTable}
          isLoading={closeTableMutation.isPending}
          error={closeTableError}
          currency={currency}
          locale={locale}
          translations={pt}
        />
      )}
    </div>
  );
}

export default TableDetailClient;
