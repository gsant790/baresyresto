"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { cn } from "@/lib/utils";

/**
 * DashboardLayoutClient Component
 *
 * Client-side wrapper for dashboard layout.
 * Manages mobile menu state and responsive layout.
 */

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  tenantSlug: string;
  tenantName: string;
  locale: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
}

export function DashboardLayoutClient({
  children,
  tenantSlug,
  tenantName,
  locale,
  userName,
  userEmail,
  userRole,
}: DashboardLayoutClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <div className="min-h-screen bg-background-dark">
      {/* Sidebar */}
      <Sidebar
        tenantSlug={tenantSlug}
        locale={locale}
        userName={userName}
        userRole={userRole}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={closeMobileMenu}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
      />

      {/* Main content area */}
      <main
        className={cn(
          "transition-all duration-300",
          isCollapsed ? "md:ml-20" : "md:ml-64" // Account for desktop sidebar width
        )}
      >
        {/* Header */}
        <Header
          tenantName={tenantName}
          tenantSlug={tenantSlug}
          locale={locale}
          userName={userName}
          userEmail={userEmail}
          onMobileMenuToggle={toggleMobileMenu}
        />

        {/* Page content */}
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
