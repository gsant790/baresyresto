import { notFound, redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getTenantBySlug } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { SettingsPageClient } from "./settings-page-client";

/**
 * Settings Page
 *
 * Server component that fetches tenant settings and renders
 * the client-side settings management interface.
 *
 * URL: /[locale]/[tenantSlug]/settings
 */

interface SettingsPageProps {
  params: Promise<{
    locale: string;
    tenantSlug: string;
  }>;
}

export async function generateMetadata({ params }: SettingsPageProps) {
  const { locale, tenantSlug } = await params;
  const t = await getTranslations({ locale, namespace: "settings" });
  const tenant = await getTenantBySlug(tenantSlug);

  return {
    title: tenant ? `${t("title")} - ${tenant.name}` : t("title"),
  };
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { locale, tenantSlug } = await params;

  // Enable static rendering
  setRequestLocale(locale);

  // Verify authentication and tenant access
  const session = await auth();
  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  // Verify user has access to this tenant
  if (session.user.tenantSlug !== tenantSlug) {
    redirect(`/${locale}/${session.user.tenantSlug}/settings`);
  }

  // Only admins can access settings
  if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect(`/${locale}/${tenantSlug}`);
  }

  // Verify tenant exists
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) {
    notFound();
  }

  // Fetch tenant settings
  const settings = await prisma.settings.findUnique({
    where: {
      tenantId: tenant.id,
    },
  });

  // Create default settings if not found
  const settingsData = settings
    ? {
        vatRate: settings.vatRate.toNumber(),
        reducedVatRate: settings.reducedVatRate.toNumber(),
        tipEnabled: settings.tipEnabled,
        tipPercentages: settings.tipPercentages,
        autoDisableOutOfStock: settings.autoDisableOutOfStock,
        currency: settings.currency,
        timezone: settings.timezone,
        defaultLanguage: settings.defaultLanguage,
      }
    : {
        vatRate: 10,
        reducedVatRate: 4,
        tipEnabled: true,
        tipPercentages: [5, 10, 15],
        autoDisableOutOfStock: true,
        currency: "EUR",
        timezone: "Europe/Madrid",
        defaultLanguage: "es",
      };

  // Fetch tenant info for general settings
  const tenantData = {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    email: tenant.email,
    phone: tenant.phone,
    address: tenant.address,
    logoUrl: tenant.logoUrl,
    plan: tenant.plan,
  };

  const t = await getTranslations({ locale, namespace: "settings" });
  const commonT = await getTranslations({ locale, namespace: "common" });

  return (
    <SettingsPageClient
      tenant={tenantData}
      settings={settingsData}
      tenantSlug={tenantSlug}
      locale={locale}
      translations={{
        title: t("title"),
        general: t("tabs.general"),
        billing: t("tabs.billing"),
        tips: t("tabs.tips"),
        integrations: t("tabs.integrations"),
        generalSettings: t("general.title"),
        billingSettings: t("billing.title"),
        tipsSettings: t("tips.title"),
        vatRate: t("billing.vatRate"),
        currency: t("general.currency"),
        timezone: t("general.timezone"),
        language: t("general.timezone"),
        tips: {
          title: t("tips.title"),
          enabled: t("tips.enableTips"),
          percentages: t("tips.suggestedPercentages"),
        },
        save: commonT("save"),
        cancel: commonT("cancel"),
      }}
    />
  );
}
