"use client";

import { useState, type FormEvent } from "react";
import { type Table } from "@prisma/client";
import { cn } from "@/lib/utils";

/**
 * TableForm Component
 *
 * Form for creating or editing a table.
 * Includes fields for number, name (optional), capacity, and zone (optional).
 */

interface TableFormProps {
  table?: Table;
  onSubmit: (data: TableFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface TableFormData {
  number: number;
  name?: string;
  capacity: number;
  zone?: string;
}

export function TableForm({
  table,
  onSubmit,
  onCancel,
  isLoading,
}: TableFormProps) {
  const [number, setNumber] = useState(table?.number?.toString() || "");
  const [name, setName] = useState(table?.name || "");
  const [capacity, setCapacity] = useState(table?.capacity?.toString() || "4");
  const [zone, setZone] = useState(table?.zone || "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = !!table;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate number
    const numValue = parseInt(number, 10);
    if (!number || isNaN(numValue) || numValue < 1) {
      newErrors.number = "Table number must be a positive integer";
    }

    // Validate capacity
    const capValue = parseInt(capacity, 10);
    if (!capacity || isNaN(capValue) || capValue < 1 || capValue > 50) {
      newErrors.capacity = "Capacity must be between 1 and 50";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    onSubmit({
      number: parseInt(number, 10),
      name: name.trim() || undefined,
      capacity: parseInt(capacity, 10),
      zone: zone.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Table Number */}
      <div className="space-y-2">
        <label
          htmlFor="table-number"
          className="block text-sm font-medium text-text-primary-dark"
        >
          Table Number <span className="text-error">*</span>
        </label>
        <input
          id="table-number"
          type="number"
          min="1"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="1"
          className={cn(
            "w-full h-10 px-4 rounded-lg",
            "bg-surface-dark border text-text-primary-dark",
            "placeholder:text-text-muted",
            "focus:outline-none focus:border-primary/50",
            errors.number ? "border-error" : "border-separator"
          )}
          disabled={isLoading}
        />
        {errors.number && (
          <p className="text-xs text-error">{errors.number}</p>
        )}
      </div>

      {/* Table Name (Optional) */}
      <div className="space-y-2">
        <label
          htmlFor="table-name"
          className="block text-sm font-medium text-text-primary-dark"
        >
          Name
          <span className="text-text-muted ml-1">(optional)</span>
        </label>
        <input
          id="table-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Window Table, VIP Corner"
          className={cn(
            "w-full h-10 px-4 rounded-lg",
            "bg-surface-dark border border-separator text-text-primary-dark",
            "placeholder:text-text-muted",
            "focus:outline-none focus:border-primary/50"
          )}
          disabled={isLoading}
        />
      </div>

      {/* Capacity */}
      <div className="space-y-2">
        <label
          htmlFor="table-capacity"
          className="block text-sm font-medium text-text-primary-dark"
        >
          Capacity <span className="text-error">*</span>
        </label>
        <div className="flex items-center gap-3">
          <input
            id="table-capacity"
            type="number"
            min="1"
            max="50"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className={cn(
              "w-24 h-10 px-4 rounded-lg text-center",
              "bg-surface-dark border text-text-primary-dark",
              "focus:outline-none focus:border-primary/50",
              errors.capacity ? "border-error" : "border-separator"
            )}
            disabled={isLoading}
          />
          <span className="text-text-secondary flex items-center gap-1">
            <span className="material-symbols-outlined text-lg">group</span>
            guests
          </span>
        </div>
        {errors.capacity && (
          <p className="text-xs text-error">{errors.capacity}</p>
        )}
      </div>

      {/* Zone (Optional) */}
      <div className="space-y-2">
        <label
          htmlFor="table-zone"
          className="block text-sm font-medium text-text-primary-dark"
        >
          Zone
          <span className="text-text-muted ml-1">(optional)</span>
        </label>
        <input
          id="table-zone"
          type="text"
          value={zone}
          onChange={(e) => setZone(e.target.value)}
          placeholder="e.g., Terrace, Main Hall, Bar Area"
          className={cn(
            "w-full h-10 px-4 rounded-lg",
            "bg-surface-dark border border-separator text-text-primary-dark",
            "placeholder:text-text-muted",
            "focus:outline-none focus:border-primary/50"
          )}
          disabled={isLoading}
        />
        <p className="text-xs text-text-muted">
          Group tables by zone for better organization
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-separator">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className={cn(
            "px-4 py-2 rounded-lg font-medium text-sm",
            "bg-surface-dark border border-separator text-text-secondary",
            "hover:bg-hover-row hover:text-text-primary-dark",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "px-6 py-2 rounded-lg font-bold text-sm",
            "bg-primary text-white",
            "hover:bg-primary-dark",
            "shadow-lg shadow-primary/20",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "flex items-center gap-2"
          )}
        >
          {isLoading && (
            <span className="material-symbols-outlined animate-spin text-lg">
              progress_activity
            </span>
          )}
          {isEdit ? "Save Changes" : "Create Table"}
        </button>
      </div>
    </form>
  );
}

export default TableForm;
