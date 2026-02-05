import { notFound, redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getTenantBySlug } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { PrepConsoleClient } from "./prep-console-client";

/**
 * Prep Console Page
 *
 * Server component for the Kitchen/Bar preparation console.
 * Validates sector, permissions, and renders the Kanban client component.
 *
 * URL: /[locale]/[tenantSlug]/prep/[sectorCode]
 * sectorCode: "KITCHEN" or "BAR"
 */

interface PrepConsolePageProps {
  params: Promise<{
    locale: string;
    tenantSlug: string;
    sectorCode: string;
  }>;
}

// Valid sector codes
const VALID_SECTORS = ["KITCHEN", "BAR"] as const;
type SectorCode = (typeof VALID_SECTORS)[number];

export async function generateMetadata({ params }: PrepConsolePageProps) {
  const { locale, tenantSlug, sectorCode } = await params;
  const t = await getTranslations({ locale, namespace: "prepConsole" });
  const tenant = await getTenantBySlug(tenantSlug);

  const sectorName =
    sectorCode === "KITCHEN" ? t("kitchen") : sectorCode === "BAR" ? t("bar") : "";

  return {
    title: tenant
      ? `${t("title")} - ${sectorName} - ${tenant.name}`
      : `${t("title")} - ${sectorName}`,
  };
}

export default async function PrepConsolePage({ params }: PrepConsolePageProps) {
  const { locale, tenantSlug, sectorCode } = await params;

  // Enable static rendering
  setRequestLocale(locale);

  // Validate sector code
  const normalizedSector = sectorCode.toUpperCase();
  if (!VALID_SECTORS.includes(normalizedSector as SectorCode)) {
    notFound();
  }
  const validSectorCode = normalizedSector as SectorCode;

  // Verify authentication
  const session = await auth();
  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  // Verify user has access to this tenant
  if (session.user.tenantSlug !== tenantSlug) {
    redirect(`/${locale}/${session.user.tenantSlug}/prep/${validSectorCode}`);
  }

  // Verify tenant exists
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) {
    notFound();
  }

  // Check role-based access to this sector
  const { role } = session.user;
  const hasAccess =
    role === "ADMIN" ||
    role === "SUPER_ADMIN" ||
    (role === "COOK" && validSectorCode === "KITCHEN") ||
    (role === "BARTENDER" && validSectorCode === "BAR");

  if (!hasAccess) {
    // Redirect to the console they can access
    if (role === "COOK") {
      redirect(`/${locale}/${tenantSlug}/prep/KITCHEN`);
    } else if (role === "BARTENDER") {
      redirect(`/${locale}/${tenantSlug}/prep/BAR`);
    } else {
      // Waiters don't have prep access
      redirect(`/${locale}/${tenantSlug}`);
    }
  }

  // Verify prep sector exists for this tenant
  const prepSector = await prisma.prepSector.findFirst({
    where: {
      tenantId: tenant.id,
      code: validSectorCode,
    },
  });

  if (!prepSector) {
    // Sector not configured for this tenant
    notFound();
  }

  // Get translations
  const t = await getTranslations({ locale, namespace: "prepConsole" });

  const sectorName = validSectorCode === "KITCHEN" ? t("kitchen") : t("bar");

  return (
    <PrepConsoleClient
      sectorCode={validSectorCode}
      sectorName={sectorName}
      tenantSlug={tenantSlug}
      translations={{
        title: t("title"),
        kitchen: t("kitchen"),
        bar: t("bar"),
        newOrders: t("newOrders"),
        inPrep: t("inPrep"),
        ready: t("ready"),
        startPrep: t("startPrep"),
        markReady: t("markReady"),
        markServed: t("markServed"),
        elapsed: t("elapsed"),
        table: t("table"),
        order: t("order"),
        allergyWarning: t("allergyWarning"),
        noOrders: t("noOrders"),
        waitstaffNotified: t("waitstaffNotified"),
        avgTime: t("avgTime"),
        online: t("online"),
        offline: t("offline"),
        logout: t("logout"),
      }}
    />
  );
}
