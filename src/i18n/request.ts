import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { locales, defaultLocale, type Locale } from "./config";

// Static imports for message files - required for Turbopack compatibility
// Turbopack cannot resolve dynamic imports with template literals
import esMessages from "@messages/es.json";
import enMessages from "@messages/en.json";

/**
 * Message files mapped by locale
 * Using static imports instead of dynamic imports for Turbopack support
 */
const messages: Record<Locale, typeof esMessages> = {
  es: esMessages,
  en: enMessages,
};

/**
 * next-intl Request Configuration
 *
 * Loads messages for the current locale during server-side rendering.
 * Messages are loaded from statically imported JSON files to ensure
 * compatibility with both Webpack and Turbopack bundlers.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  // Get the requested locale, with fallback to default
  const requested = await requestLocale;
  const locale = hasLocale(locales, requested) ? requested : defaultLocale;

  return {
    locale,
    messages: messages[locale],
  };
});
