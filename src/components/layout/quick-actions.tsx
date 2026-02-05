"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * QuickActions Component
 *
 * Quick action buttons for the dashboard.
 * Provides easy access to common tasks.
 */

interface QuickAction {
  label: string;
  icon: string;
  href: string;
  variant?: "primary" | "secondary";
  description?: string;
}

interface QuickActionsProps {
  tenantSlug: string;
  locale: string;
}

export function QuickActions({ tenantSlug, locale }: QuickActionsProps) {
  const router = useRouter();

  const actions: QuickAction[] = [
    {
      label: "New Order",
      icon: "add_shopping_cart",
      href: `/${locale}/${tenantSlug}/orders`,
      variant: "primary",
      description: "Create a new order",
    },
    {
      label: "View Tables",
      icon: "table_restaurant",
      href: `/${locale}/${tenantSlug}/tables`,
      variant: "secondary",
      description: "Manage table status",
    },
    {
      label: "Kitchen View",
      icon: "skillet",
      href: `/${locale}/${tenantSlug}/kitchen`,
      variant: "secondary",
      description: "View active orders",
    },
    {
      label: "Process Payment",
      icon: "payments",
      href: `/${locale}/${tenantSlug}/payments`,
      variant: "secondary",
      description: "Process table payment",
    },
  ];

  const handleActionClick = (href: string) => {
    // Cast to any to work with dynamic routes and typedRoutes
    router.push(href as Parameters<typeof router.push>[0]);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action) => (
        <button
          key={action.href}
          type="button"
          onClick={() => handleActionClick(action.href)}
          className={cn(
            "flex flex-col items-start gap-3 p-4 rounded-xl border transition-all text-left",
            "hover:scale-[1.02] active:scale-[0.98]",
            action.variant === "primary"
              ? "bg-primary/10 border-primary/20 hover:bg-primary/15"
              : "bg-card-dark border-separator hover:bg-hover-row"
          )}
        >
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-lg",
              action.variant === "primary"
                ? "bg-primary/20 text-primary"
                : "bg-surface-dark text-text-secondary"
            )}
          >
            <span className="material-symbols-outlined text-2xl">
              {action.icon}
            </span>
          </div>
          <div className="flex-1">
            <h3
              className={cn(
                "font-semibold",
                action.variant === "primary"
                  ? "text-primary"
                  : "text-text-primary-dark"
              )}
            >
              {action.label}
            </h3>
            {action.description && (
              <p className="text-xs text-text-muted mt-1">
                {action.description}
              </p>
            )}
          </div>
          <span className="material-symbols-outlined text-text-muted text-lg ml-auto">
            arrow_forward
          </span>
        </button>
      ))}
    </div>
  );
}
