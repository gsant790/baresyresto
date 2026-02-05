/**
 * Authentication Routes Layout
 *
 * This layout wraps authentication-related pages:
 * - /[locale]/login - Staff login page
 *
 * These pages have a centered card layout for the auth forms.
 */

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-background-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
