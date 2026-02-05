"use client";

import { cn } from "@/lib/utils";

/**
 * TicketItem Component
 *
 * Displays a single item within an order ticket.
 * Shows quantity, item name, and any special notes/modifiers.
 * Can optionally display allergen warnings.
 */

interface TicketItemProps {
  /** Quantity ordered */
  quantity: number;
  /** Item name */
  name: string;
  /** Special notes or modifiers */
  notes?: string | null;
  /** Allergens for this item */
  allergens?: string[];
  /** Compact mode for smaller display */
  compact?: boolean;
  /** Optional CSS classes */
  className?: string;
}

export function TicketItem({
  quantity,
  name,
  notes,
  allergens = [],
  compact = false,
  className,
}: TicketItemProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-2",
        compact ? "text-sm" : "text-base",
        className
      )}
    >
      {/* Quantity Badge */}
      <span
        className={cn(
          "flex-shrink-0 flex items-center justify-center bg-primary/20 text-primary rounded font-bold",
          compact ? "w-5 h-5 text-xs" : "w-6 h-6 text-sm"
        )}
      >
        {quantity}
      </span>

      {/* Item Details */}
      <div className="flex-1 min-w-0">
        {/* Item Name */}
        <p
          className={cn(
            "text-text-primary-dark font-medium",
            compact ? "text-sm" : "text-base"
          )}
        >
          {name}
        </p>

        {/* Notes/Modifiers */}
        {notes && (
          <p
            className={cn(
              "text-orange-400 italic mt-0.5",
              compact ? "text-xs" : "text-sm"
            )}
          >
            {notes}
          </p>
        )}

        {/* Allergen Warning (inline) */}
        {allergens.length > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <span className="material-symbols-outlined text-red-400 text-xs">
              warning
            </span>
            <span className="text-xs text-red-400 font-medium">
              {allergens.join(", ")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default TicketItem;
