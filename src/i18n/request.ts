import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { locales, defaultLocale } from "./config";

/**
 * next-intl Request Configuration
 *
 * Loads messages for the current locale during server-side rendering.
 * Messages are loaded dynamically from JSON files in the messages directory.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  // Get the requested locale, with fallback to default
  const requested = await requestLocale;
  const locale = hasLocale(locales, requested) ? requested : defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
