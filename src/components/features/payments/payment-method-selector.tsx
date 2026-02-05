"use client";

import { PaymentMethod } from "@prisma/client";
import { cn } from "@/lib/utils";

/**
 * PaymentMethodSelector Component
 *
 * Displays selectable payment method options (CASH, CARD, BIZUM).
 * Used in the close table modal to select how the customer paid.
 */

interface PaymentMethodSelectorProps {
  selected: PaymentMethod | null;
  onSelect: (method: PaymentMethod) => void;
  disabled?: boolean;
  translations: {
    cash: string;
    card: string;
    bizum: string;
  };
}

// Payment method configuration
const paymentMethods: {
  value: PaymentMethod;
  icon: string;
  labelKey: keyof PaymentMethodSelectorProps["translations"];
  color: string;
  bgColor: string;
}[] = [
  {
    value: "CASH",
    icon: "payments",
    labelKey: "cash",
    color: "text-green-400",
    bgColor: "bg-green-500/10 border-green-500/30",
  },
  {
    value: "CARD",
    icon: "credit_card",
    labelKey: "card",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10 border-blue-500/30",
  },
  {
    value: "BIZUM",
    icon: "phone_android",
    labelKey: "bizum",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10 border-purple-500/30",
  },
];

export function PaymentMethodSelector({
  selected,
  onSelect,
  disabled = false,
  translations,
}: PaymentMethodSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {paymentMethods.map((method) => {
        const isSelected = selected === method.value;

        return (
          <button
            key={method.value}
            type="button"
            onClick={() => onSelect(method.value)}
            disabled={disabled}
            className={cn(
              "flex flex-col items-center justify-center gap-2 p-4 rounded-xl",
              "border-2 transition-all duration-200",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isSelected
                ? cn(method.bgColor, method.color, "shadow-lg")
                : "border-separator bg-card-dark text-text-secondary hover:border-primary/50 hover:bg-hover-row"
            )}
            aria-pressed={isSelected}
          >
            <span
              className={cn(
                "material-symbols-outlined text-3xl",
                isSelected ? method.color : ""
              )}
            >
              {method.icon}
            </span>
            <span className="text-sm font-medium">
              {translations[method.labelKey]}
            </span>
            {isSelected && (
              <span className="absolute top-2 right-2">
                <span className="material-symbols-outlined text-lg text-primary">
                  check_circle
                </span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default PaymentMethodSelector;
