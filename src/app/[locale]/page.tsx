import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";

/**
 * Locale Root Page
 *
 * Landing page for each locale.
 * - If authenticated: redirect to user's tenant dashboard
 * - If not authenticated: redirect to login
 */

interface LocaleRootPageProps {
  params: Promise<{ locale: string }>;
}

export default async function LocaleRootPage({ params }: LocaleRootPageProps) {
  const { locale } = await params;

  // Enable static rendering
  setRequestLocale(locale);

  // Check if user is authenticated
  const session = await auth();

  if (session?.user) {
    // Redirect to user's tenant dashboard
    redirect(`/${locale}/${session.user.tenantSlug}`);
  }

  // Not authenticated - redirect to login
  redirect(`/${locale}/login`);
}
