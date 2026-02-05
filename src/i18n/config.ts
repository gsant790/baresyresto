/**
 * Internationalization Configuration
 *
 * Defines the supported locales and default locale for the application.
 * Spanish is the primary language, with English as secondary.
 */

export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "es";

/**
 * Locale display names for UI
 */
export const localeNames: Record<Locale, string> = {
  es: "Espanol",
  en: "English",
};

/**
 * Check if a string is a valid locale
 */
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}
