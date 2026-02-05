import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { locales, defaultLocale, type Locale } from "./config";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Load messages from JSON files using fs.readFileSync
 *
 * This approach uses Node.js fs module with absolute paths constructed
 * via process.cwd() to bypass Turbopack's module resolution issues.
 * Turbopack has trouble resolving JSON files through import() or require()
 * at build time, but fs.readFileSync with absolute paths works reliably
 * in both development and Vercel production environments.
 */
function loadMessages(locale: Locale): Record<string, unknown> {
  const messagesPath = path.join(process.cwd(), "messages", `${locale}.json`);

  try {
    const fileContents = fs.readFileSync(messagesPath, "utf-8");
    return JSON.parse(fileContents) as Record<string, unknown>;
  } catch (error) {
    console.error(`Failed to load messages for locale "${locale}":`, error);
    // Return empty object as fallback to prevent app crash
    return {};
  }
}

/**
 * next-intl Request Configuration
 *
 * Loads messages for the current locale during server-side rendering.
 * Messages are loaded from JSON files using fs.readFileSync with absolute
 * paths to ensure compatibility with both Webpack and Turbopack bundlers,
 * as well as Vercel's production build environment.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  // Get the requested locale, with fallback to default
  const requested = await requestLocale;
  const locale = hasLocale(locales, requested) ? requested : defaultLocale;

  return {
    locale,
    messages: loadMessages(locale),
  };
});
