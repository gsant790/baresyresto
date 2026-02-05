"use client";

import { type Table, TableStatus } from "@prisma/client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { TableCard } from "./table-card";

/**
 * TablesGrid Component
 *
 * Displays a grid of table cards with filtering by status.
 * Includes filter tabs for each status and an "All" option.
 */

interface TablesGridProps {
  tables: Table[];
  onTableClick?: (table: Table) => void;
  selectedTableId?: string;
}

type FilterOption = "ALL" | TableStatus;

// Filter configuration
const filterOptions: { value: FilterOption; label: string; icon: string }[] = [
  { value: "ALL", label: "All", icon: "table_restaurant" },
  { value: "AVAILABLE", label: "Available", icon: "check_circle" },
  { value: "OCCUPIED", label: "Occupied", icon: "groups" },
  { value: "RESERVED", label: "Reserved", icon: "event" },
  { value: "CLEANING", label: "Cleaning", icon: "cleaning_services" },
];

// Status count colors
const countColors: Record<FilterOption, string> = {
  ALL: "bg-slate-500/10 text-slate-400",
  AVAILABLE: "bg-green-500/10 text-green-400",
  OCCUPIED: "bg-orange-500/10 text-orange-400",
  RESERVED: "bg-blue-500/10 text-blue-400",
  CLEANING: "bg-amber-500/10 text-amber-400",
};

export function TablesGrid({
  tables,
  onTableClick,
  selectedTableId,
}: TablesGridProps) {
  const [filter, setFilter] = useState<FilterOption>("ALL");

  // Calculate counts for each status
  const counts = tables.reduce(
    (acc, table) => {
      acc[table.status] = (acc[table.status] || 0) + 1;
      acc.ALL = (acc.ALL || 0) + 1;
      return acc;
    },
    { ALL: 0 } as Record<FilterOption, number>
  );

  // Filter tables based on selected status
  const filteredTables =
    filter === "ALL"
      ? tables
      : tables.filter((table) => table.status === filter);

  // Group tables by zone for better organization
  const tablesByZone = filteredTables.reduce(
    (acc, table) => {
      const zone = table.zone || "No Zone";
      if (!acc[zone]) {
        acc[zone] = [];
      }
      acc[zone].push(table);
      return acc;
    },
    {} as Record<string, Table[]>
  );

  const zones = Object.keys(tablesByZone).sort();

  return (
    <div className="space-y-6">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              filter === option.value
                ? "bg-primary/20 text-primary border border-primary/10"
                : "bg-card-dark text-text-secondary border border-separator hover:bg-hover-row hover:text-text-primary-dark"
            )}
          >
            <span className="material-symbols-outlined text-lg">
              {option.icon}
            </span>
            <span>{option.label}</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-xs font-bold",
                countColors[option.value]
              )}
            >
              {counts[option.value] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Tables grid - grouped by zone */}
      {filteredTables.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <span className="material-symbols-outlined text-5xl text-text-muted mb-4">
            table_restaurant
          </span>
          <p className="text-text-secondary">
            {filter === "ALL"
              ? "No tables found. Add your first table to get started."
              : `No ${filter.toLowerCase()} tables.`}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {zones.map((zone) => (
            <div key={zone}>
              {/* Zone header (only show if there are multiple zones or zone is named) */}
              {(zones.length > 1 || zone !== "No Zone") && (
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted mb-4">
                  {zone}
                </h3>
              )}

              {/* Grid of table cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {tablesByZone[zone].map((table) => (
                  <TableCard
                    key={table.id}
                    table={table}
                    onClick={() => onTableClick?.(table)}
                    selected={table.id === selectedTableId}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TablesGrid;
