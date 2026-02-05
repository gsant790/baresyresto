import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";

/**
 * Login Page
 *
 * Staff authentication page for restaurant employees.
 * Supports multi-tenant login by requiring a restaurant slug.
 *
 * URL: /[locale]/login
 */

interface LoginPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: LoginPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });

  return {
    title: t("login.title"),
  };
}

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params;

  // Enable static rendering
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "auth" });

  return (
    <div className="bg-surface-dark rounded-xl border border-separator p-8 shadow-2xl">
      {/* Logo and title */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-2xl mb-4">
          <span className="material-symbols-outlined text-primary text-3xl">
            skillet
          </span>
        </div>
        <h1 className="text-2xl font-bold text-text-primary-dark">
          {t("login.title")}
        </h1>
        <p className="text-text-secondary mt-2">{t("login.subtitle")}</p>
      </div>

      {/* Login form */}
      <LoginForm
        translations={{
          restaurant: t("login.restaurant"),
          restaurantPlaceholder: t("login.restaurantPlaceholder"),
          email: t("login.email"),
          emailPlaceholder: t("login.emailPlaceholder"),
          password: t("login.password"),
          passwordPlaceholder: t("login.passwordPlaceholder"),
          submit: t("login.submit"),
          forgotPassword: t("login.forgotPassword"),
          errors: {
            invalidCredentials: t("login.errors.invalidCredentials"),
            tenantNotFound: t("login.errors.tenantNotFound"),
            accountDisabled: t("login.errors.accountDisabled"),
          },
        }}
        locale={locale}
      />

      {/* Footer links */}
      <div className="mt-6 text-center">
        <a
          href="#"
          className="text-sm text-text-secondary hover:text-primary transition-colors"
        >
          {t("login.forgotPassword")}
        </a>
      </div>
    </div>
  );
}
