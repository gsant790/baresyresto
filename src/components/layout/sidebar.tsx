"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Sidebar Component
 *
 * Collapsible navigation sidebar with:
 * - Logo/brand
 * - Navigation items with active state
 * - User info at bottom
 * - Collapse/expand toggle
 * - Mobile responsive (drawer on mobile)
 */

interface SidebarProps {
  tenantSlug: string;
  locale: string;
  userName?: string;
  userRole?: string;
  isMobileOpen: boolean;
  onMobileClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  label: string;
  icon: string;
  href: string;
  badge?: number;
}

export function Sidebar({
  tenantSlug,
  locale,
  userName,
  userRole,
  isMobileOpen,
  onMobileClose,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      icon: "dashboard",
      href: `/${locale}/${tenantSlug}`,
    },
    {
      label: "Tables",
      icon: "table_restaurant",
      href: `/${locale}/${tenantSlug}/tables`,
    },
    {
      label: "Menu",
      icon: "restaurant_menu",
      href: `/${locale}/${tenantSlug}/menu`,
    },
    {
      label: "Inventory",
      icon: "inventory_2",
      href: `/${locale}/${tenantSlug}/inventory`,
    },
    {
      label: "Orders",
      icon: "receipt_long",
      href: `/${locale}/${tenantSlug}/orders`,
    },
    {
      label: "Kitchen",
      icon: "skillet",
      href: `/${locale}/${tenantSlug}/kitchen`,
    },
    {
      label: "Bar",
      icon: "local_bar",
      href: `/${locale}/${tenantSlug}/bar`,
    },
    {
      label: "Payments",
      icon: "payments",
      href: `/${locale}/${tenantSlug}/payments`,
    },
    {
      label: "Settings",
      icon: "settings",
      href: `/${locale}/${tenantSlug}/settings`,
    },
  ];

  const isActiveRoute = (href: string) => {
    if (href === `/${locale}/${tenantSlug}`) {
      return pathname === href;
    }

    // Handle kitchen/bar redirects to /prep/KITCHEN and /prep/BAR
    if (href === `/${locale}/${tenantSlug}/kitchen` && pathname.includes("/prep/KITCHEN")) {
      return true;
    }
    if (href === `/${locale}/${tenantSlug}/bar` && pathname.includes("/prep/BAR")) {
      return true;
    }

    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-separator px-6 gap-3 transition-all",
          isCollapsed && "px-4 justify-center"
        )}
      >
        <span className="material-symbols-outlined text-primary text-2xl flex-shrink-0">
          skillet
        </span>
        {!isCollapsed && (
          <span className="text-xl font-bold text-text-primary-dark truncate">
            BaresyResto
          </span>
        )}
      </div>

      {/* Navigation items */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = isActiveRoute(item.href);
          return (
            <Link
              key={item.href}
              href={item.href as `/`}
              onClick={onMobileClose}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-all",
                "hover:bg-hover-row",
                isActive
                  ? "bg-primary/20 text-primary border border-primary/10"
                  : "text-text-secondary hover:text-text-primary-dark",
                isCollapsed && "justify-center px-2"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <span className="material-symbols-outlined flex-shrink-0">
                {item.icon}
              </span>
              {!isCollapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-error text-white rounded-full">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="border-t border-separator p-4">
        <div
          className={cn(
            "flex items-center gap-3 px-3 py-2 transition-all",
            isCollapsed && "justify-center px-0"
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary font-bold flex-shrink-0">
            {userName?.charAt(0).toUpperCase() || "U"}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary-dark truncate">
                {userName}
              </p>
              <p className="text-xs text-text-secondary truncate capitalize">
                {userRole?.toLowerCase()}
              </p>
            </div>
          )}
        </div>

        {/* Collapse toggle - desktop only */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className={cn(
            "mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg",
            "text-text-secondary hover:text-text-primary-dark hover:bg-hover-row",
            "transition-all hidden md:flex",
            isCollapsed && "px-2"
          )}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span className="material-symbols-outlined text-lg">
            {isCollapsed ? "chevron_right" : "chevron_left"}
          </span>
          {!isCollapsed && (
            <span className="text-xs font-medium">Collapse</span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 hidden h-screen border-r border-separator bg-surface-dark md:block transition-all duration-300",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onMobileClose}
          aria-label="Close menu"
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 border-r border-separator bg-surface-dark md:hidden",
          "transition-transform duration-300 ease-in-out",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
