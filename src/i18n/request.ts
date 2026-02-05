import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { locales, defaultLocale, type Locale } from "./config";

// Use require() for JSON files - Turbopack has issues resolving JSON through path aliases
// with ES module imports. require() is more reliable for JSON modules in Turbopack.
/* eslint-disable @typescript-eslint/no-require-imports */
const esMessages = require("../../messages/es.json");
const enMessages = require("../../messages/en.json");
/* eslint-enable @typescript-eslint/no-require-imports */

/**
 * Message files mapped by locale
 * Using require() instead of import for Turbopack JSON compatibility
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
