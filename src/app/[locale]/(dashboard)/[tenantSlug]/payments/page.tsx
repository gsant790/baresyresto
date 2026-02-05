import { notFound, redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getTenantBySlug } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { PaymentsPageClient } from "./payments-page-client";

/**
 * Payments Overview Page
 *
 * Server component that fetches payment data and renders
 * the client-side payments management interface.
 *
 * URL: /[locale]/[tenantSlug]/payments
 */

interface PaymentsPageProps {
  params: Promise<{
    locale: string;
    tenantSlug: string;
  }>;
}

export async function generateMetadata({ params }: PaymentsPageProps) {
  const { locale, tenantSlug } = await params;
  const t = await getTranslations({ locale, namespace: "payments" });
  const tenant = await getTenantBySlug(tenantSlug);

  return {
    title: tenant ? `${t("title")} - ${tenant.name}` : t("title"),
  };
}

export default async function PaymentsPage({ params }: PaymentsPageProps) {
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
    redirect(`/${locale}/${session.user.tenantSlug}/payments`);
  }

  // Verify tenant exists
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) {
    notFound();
  }

  // Fetch payments with related order data
  const payments = await prisma.payment.findMany({
    where: {
      tenantId: tenant.id,
    },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          total: true,
          table: {
            select: {
              id: true,
              number: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100, // Limit to recent payments for performance
  });

  // Get payment stats
  const stats = {
    total: payments.length,
    pending: payments.filter((p) => p.status === "PENDING").length,
    processing: payments.filter((p) => p.status === "PROCESSING").length,
    completed: payments.filter((p) => p.status === "COMPLETED").length,
    failed: payments.filter((p) => p.status === "FAILED").length,
    refunded: payments.filter((p) => p.status === "REFUNDED").length,
  };

  // Calculate totals by method
  const completedPayments = payments.filter((p) => p.status === "COMPLETED");
  const totalsByMethod = {
    cash: completedPayments
      .filter((p) => p.method === "CASH")
      .reduce((sum, p) => sum + Number(p.amount), 0),
    card: completedPayments
      .filter((p) => p.method === "CARD")
      .reduce((sum, p) => sum + Number(p.amount), 0),
    bizum: completedPayments
      .filter((p) => p.method === "BIZUM")
      .reduce((sum, p) => sum + Number(p.amount), 0),
  };

  // Transform payments for client (convert Decimal to number)
  const paymentsData = payments.map((payment) => ({
    ...payment,
    amount: payment.amount.toNumber(),
    order: {
      ...payment.order,
      total: payment.order.total.toNumber(),
    },
  }));

  const t = await getTranslations({ locale, namespace: "payments" });
  const commonT = await getTranslations({ locale, namespace: "common" });

  return (
    <PaymentsPageClient
      initialPayments={paymentsData}
      stats={stats}
      totalsByMethod={totalsByMethod}
      tenantSlug={tenantSlug}
      locale={locale}
      translations={{
        title: t("title"),
        total: t("total"),
        methods: {
          cash: t("methods.cash"),
          card: t("methods.card"),
          bizum: t("methods.bizum"),
        },
        status: {
          pending: t("status.pending"),
          processing: t("status.processing"),
          completed: t("status.completed"),
          failed: t("status.failed"),
          refunded: t("status.refunded"),
        },
        search: commonT("search"),
        filter: commonT("filter"),
        noResults: commonT("noResults"),
      }}
    />
  );
}
