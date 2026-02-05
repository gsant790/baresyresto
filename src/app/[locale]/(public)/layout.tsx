/**
 * Public Routes Layout
 *
 * This layout wraps all public routes that don't require authentication:
 * - /[locale]/menu/[tenantSlug]/[tableCode] - Customer menu view
 *
 * These routes are accessible without login, allowing customers
 * to scan QR codes and view menus directly.
 */

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <main className="min-h-screen bg-background-dark">{children}</main>
  );
}
