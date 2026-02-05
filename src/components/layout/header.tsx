"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";
import { cn } from "@/lib/utils";

/**
 * Header Component
 *
 * Top header bar with:
 * - Mobile menu toggle
 * - Search bar (optional)
 * - Notifications bell
 * - User dropdown (profile, logout)
 * - Tenant/restaurant name
 */

interface HeaderProps {
  tenantName: string;
  tenantSlug: string;
  locale: string;
  userName?: string;
  userEmail?: string;
  onMobileMenuToggle: () => void;
}

export function Header({
  tenantName,
  tenantSlug,
  locale,
  userName,
  userEmail,
  onMobileMenuToggle,
}: HeaderProps) {
  const router = useRouter();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [notificationCount] = useState(0); // TODO: Connect to actual notifications
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isUserMenuOpen]);

  const handleLogout = async () => {
    await signOut();
    router.push(`/${locale}/login`);
  };

  const handleProfile = () => {
    router.push(`/${locale}/${tenantSlug}/settings`);
    setIsUserMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-separator bg-surface-dark px-4 md:px-6">
      {/* Left section */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="p-2 text-text-secondary hover:text-text-primary-dark hover:bg-hover-row rounded-lg md:hidden"
          aria-label="Open menu"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        {/* Tenant name */}
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-lg font-semibold text-text-primary-dark truncate">
            {tenantName}
          </h1>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Search button */}
        <button
          type="button"
          onClick={() => setShowSearch(!showSearch)}
          className="p-2 text-text-secondary hover:text-text-primary-dark hover:bg-hover-row rounded-lg hidden sm:block"
          aria-label="Search"
        >
          <span className="material-symbols-outlined">search</span>
        </button>

        {/* Notifications button */}
        <button
          type="button"
          className="relative p-2 text-text-secondary hover:text-text-primary-dark hover:bg-hover-row rounded-lg"
          aria-label="Notifications"
        >
          <span className="material-symbols-outlined">notifications</span>
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-error text-white text-[10px] font-bold">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </button>

        {/* User dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className={cn(
              "flex items-center gap-2 p-2 rounded-lg hover:bg-hover-row transition-colors",
              isUserMenuOpen && "bg-hover-row"
            )}
            aria-label="User menu"
            aria-expanded={isUserMenuOpen}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-sm">
              {userName?.charAt(0).toUpperCase() || "U"}
            </div>
            <span className="material-symbols-outlined text-text-secondary text-lg">
              {isUserMenuOpen ? "expand_less" : "expand_more"}
            </span>
          </button>

          {/* Dropdown menu */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-surface-dark rounded-lg border border-separator shadow-2xl overflow-hidden">
              {/* User info */}
              <div className="px-4 py-3 border-b border-separator">
                <p className="text-sm font-medium text-text-primary-dark truncate">
                  {userName}
                </p>
                <p className="text-xs text-text-secondary truncate">
                  {userEmail}
                </p>
              </div>

              {/* Menu items */}
              <div className="py-2">
                <button
                  type="button"
                  onClick={handleProfile}
                  className="w-full flex items-center gap-3 px-4 py-2 text-text-secondary hover:bg-hover-row hover:text-text-primary-dark transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">
                    person
                  </span>
                  <span className="text-sm font-medium">Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    router.push(`/${locale}/${tenantSlug}/settings`);
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-text-secondary hover:bg-hover-row hover:text-text-primary-dark transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">
                    settings
                  </span>
                  <span className="text-sm font-medium">Settings</span>
                </button>

                <div className="my-2 border-t border-separator" />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-error hover:bg-red-500/10 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">
                    logout
                  </span>
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search bar overlay */}
      {showSearch && (
        <div className="absolute top-16 left-0 right-0 bg-surface-dark border-b border-separator p-4 shadow-lg">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search orders, tables, menu items..."
                className="w-full px-4 py-3 pl-12 bg-card-dark border border-separator rounded-lg text-text-primary-dark placeholder:text-text-muted focus:outline-none focus:border-primary"
                autoFocus
              />
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                search
              </span>
              <button
                type="button"
                onClick={() => setShowSearch(false)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary-dark"
                aria-label="Close search"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
