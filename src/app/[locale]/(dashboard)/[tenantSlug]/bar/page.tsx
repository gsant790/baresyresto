import { redirect } from "next/navigation";

/**
 * Bar Page
 *
 * Redirects to the Bar prep console.
 * The actual Bar interface is at /[locale]/[tenantSlug]/prep/BAR
 *
 * URL: /[locale]/[tenantSlug]/bar
 */

interface BarPageProps {
  params: Promise<{
    locale: string;
    tenantSlug: string;
  }>;
}

export default async function BarPage({ params }: BarPageProps) {
  const { locale, tenantSlug } = await params;

  // Redirect to the Bar prep console
  redirect(`/${locale}/${tenantSlug}/prep/BAR`);
}
