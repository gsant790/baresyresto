"use client";

import { cn } from "@/lib/utils";

/**
 * AllergyBadge Component
 *
 * Displays allergen warnings prominently on order cards.
 * Uses high-contrast styling with red background to ensure visibility.
 * Critical for food safety in kitchen/bar environments.
 */

interface AllergyBadgeProps {
  /** List of allergens to display */
  allergens: string[];
  /** Optional CSS classes */
  className?: string;
  /** Compact mode for inline display */
  compact?: boolean;
}

// Common allergen display names (for localization)
const allergenLabels: Record<string, { es: string; en: string }> = {
  gluten: { es: "Gluten", en: "Gluten" },
  dairy: { es: "Lacteos", en: "Dairy" },
  nuts: { es: "Frutos secos", en: "Nuts" },
  peanuts: { es: "Cacahuetes", en: "Peanuts" },
  shellfish: { es: "Mariscos", en: "Shellfish" },
  fish: { es: "Pescado", en: "Fish" },
  eggs: { es: "Huevos", en: "Eggs" },
  soy: { es: "Soja", en: "Soy" },
  sesame: { es: "Sesamo", en: "Sesame" },
  celery: { es: "Apio", en: "Celery" },
  mustard: { es: "Mostaza", en: "Mustard" },
  sulfites: { es: "Sulfitos", en: "Sulfites" },
  lupin: { es: "Altramuces", en: "Lupin" },
  mollusks: { es: "Moluscos", en: "Mollusks" },
};

export function AllergyBadge({
  allergens,
  className,
  compact = false,
}: AllergyBadgeProps) {
  if (!allergens || allergens.length === 0) {
    return null;
  }

  // Get display name for an allergen (fallback to original if not found)
  const getDisplayName = (allergen: string): string => {
    const normalized = allergen.toLowerCase().trim();
    return allergenLabels[normalized]?.es || allergen;
  };

  if (compact) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold",
          "bg-red-600 text-white",
          className
        )}
      >
        <span className="material-symbols-outlined text-xs">warning</span>
        {allergens.length}
      </span>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 px-3 py-2 rounded-lg",
        "bg-red-600/90 border border-red-500",
        className
      )}
    >
      <span className="material-symbols-outlined text-white text-lg">
        warning
      </span>
      <span className="font-bold text-white text-sm uppercase tracking-wide">
        ALERGIAS:
      </span>
      <span className="text-white text-sm font-medium">
        {allergens.map((a) => getDisplayName(a)).join(", ")}
      </span>
    </div>
  );
}

export default AllergyBadge;
