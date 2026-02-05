"use client";

import { type Table, TableStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

/**
 * TableCard Component
 *
 * Displays a single table's information in a card format.
 * Shows table number, name, status indicator, and capacity.
 *
 * Status colors follow the design system:
 * - AVAILABLE: green
 * - OCCUPIED: orange
 * - RESERVED: blue
 * - CLEANING: amber/yellow
 */

interface TableCardProps {
  table: Table;
  onClick?: () => void;
  selected?: boolean;
}

// Status color mapping based on design tokens
const statusColors: Record<TableStatus, {
  bg: string;
  text: string;
  dot: string;
  border: string;
}> = {
  AVAILABLE: {
    bg: "bg-green-500/10",
    text: "text-green-400",
    dot: "bg-green-500",
    border: "border-green-500/20",
  },
  OCCUPIED: {
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    dot: "bg-orange-500",
    border: "border-orange-500/20",
  },
  RESERVED: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    dot: "bg-blue-500",
    border: "border-blue-500/20",
  },
  CLEANING: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    dot: "bg-amber-500",
    border: "border-amber-500/20",
  },
};

// Status label translations (will be replaced with i18n)
const statusLabels: Record<TableStatus, string> = {
  AVAILABLE: "Available",
  OCCUPIED: "Occupied",
  RESERVED: "Reserved",
  CLEANING: "Cleaning",
};

export function TableCard({ table, onClick, selected }: TableCardProps) {
  const colors = statusColors[table.status];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center",
        "w-full aspect-square p-4",
        "bg-card-dark rounded-xl border transition-all",
        "hover:shadow-md hover:bg-hover-row",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        selected
          ? "border-primary ring-2 ring-primary/20"
          : "border-separator",
        onClick && "cursor-pointer"
      )}
    >
      {/* Status indicator dot */}
      <span
        className={cn(
          "absolute top-3 right-3 w-3 h-3 rounded-full",
          colors.dot,
          table.status === "OCCUPIED" && "animate-pulse"
        )}
      />

      {/* Table number */}
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-surface-dark border border-separator mb-3">
        <span className="text-2xl font-bold text-text-primary-dark">
          {table.number}
        </span>
      </div>

      {/* Table name (if present) */}
      {table.name && (
        <p className="text-sm font-medium text-text-primary-dark truncate max-w-full">
          {table.name}
        </p>
      )}

      {/* Status badge */}
      <span
        className={cn(
          "mt-2 px-2.5 py-1 rounded-full text-xs font-medium",
          colors.bg,
          colors.text,
          "border",
          colors.border
        )}
      >
        {statusLabels[table.status]}
      </span>

      {/* Capacity indicator */}
      <div className="mt-2 flex items-center gap-1 text-text-muted">
        <span className="material-symbols-outlined text-sm">group</span>
        <span className="text-xs">{table.capacity}</span>
      </div>

      {/* Zone (if present) */}
      {table.zone && (
        <p className="mt-1 text-xs text-text-secondary truncate max-w-full">
          {table.zone}
        </p>
      )}
    </button>
  );
}

export default TableCard;
