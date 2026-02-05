"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * StockToggle Component
 *
 * A toggle switch for controlling dish availability.
 * Uses orange color when active to match design tokens.
 */

interface StockToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
}

export function StockToggle({
  checked,
  onChange,
  disabled,
  label,
  id,
}: StockToggleProps) {
  const generatedId = useId();
  const toggleId = id || `stock-toggle-${generatedId}`;

  return (
    <label
      htmlFor={toggleId}
      className={cn(
        "inline-flex items-center gap-2 cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="relative">
        <input
          id={toggleId}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="peer sr-only"
        />
        <div
          className={cn(
            "w-11 h-6 rounded-full transition-colors",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background-dark",
            checked ? "bg-primary" : "bg-separator"
          )}
        />
        <div
          className={cn(
            "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform",
            checked && "translate-x-5"
          )}
        />
      </div>
      {label && (
        <span
          className={cn(
            "text-sm font-medium",
            checked ? "text-primary" : "text-text-secondary"
          )}
        >
          {label}
        </span>
      )}
    </label>
  );
}

export default StockToggle;
