import { redirect } from "next/navigation";

/**
 * Kitchen Page
 *
 * Redirects to the Kitchen prep console.
 * The actual Kitchen interface is at /[locale]/[tenantSlug]/prep/KITCHEN
 *
 * URL: /[locale]/[tenantSlug]/kitchen
 */

interface KitchenPageProps {
  params: Promise<{
    locale: string;
    tenantSlug: string;
  }>;
}

export default async function KitchenPage({ params }: KitchenPageProps) {
  const { locale, tenantSlug } = await params;

  // Redirect to the Kitchen prep console
  redirect(`/${locale}/${tenantSlug}/prep/KITCHEN`);
}
