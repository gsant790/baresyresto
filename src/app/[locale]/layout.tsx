import { notFound } from "next/navigation";
import { setRequestLocale, getMessages } from "next-intl/server";
import { locales, type Locale } from "@/i18n/config";
import { Providers } from "@/components/providers";

/**
 * Locale Layout
 *
 * This layout handles:
 * - Locale validation and 404 for invalid locales
 * - Setting up the HTML document with correct lang attribute
 * - Providing internationalization context via NextIntlClientProvider
 * - Wrapping with SessionProvider for authentication
 *
 * All pages under /[locale] will inherit this layout.
 */

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Get messages for the current locale
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Material Symbols Outlined font for icons */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background-dark text-text-primary-dark antialiased">
        <Providers locale={locale} messages={messages}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
