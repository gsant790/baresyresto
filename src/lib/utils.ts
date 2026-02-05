import { type ClassValue, clsx } from "clsx";

/**
 * Utility Functions
 *
 * Common utilities used throughout the application.
 */

/**
 * Combine class names with clsx
 * Useful for conditional class application
 *
 * @example
 * cn("base-class", isActive && "active-class", className)
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Format currency amount
 *
 * @param amount - The amount to format
 * @param currency - The currency code (default: EUR)
 * @param locale - The locale for formatting (default: es-ES)
 */
export function formatCurrency(
  amount: number | string,
  currency: string = "EUR",
  locale: string = "es-ES"
): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(numAmount);
}

/**
 * Format date relative to now
 *
 * @param date - The date to format
 * @param locale - The locale for formatting
 */
export function formatRelativeTime(
  date: Date | string,
  locale: string = "es-ES"
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (diffMinutes < 1) {
    return rtf.format(-diffSeconds, "second");
  }
  if (diffHours < 1) {
    return rtf.format(-diffMinutes, "minute");
  }
  if (diffHours < 24) {
    return rtf.format(-diffHours, "hour");
  }

  return d.toLocaleDateString(locale);
}

/**
 * Format elapsed time in minutes:seconds
 *
 * @param startTime - The start time
 */
export function formatElapsedTime(startTime: Date | string): string {
  const start = typeof startTime === "string" ? new Date(startTime) : startTime;
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(diffSeconds / 60);
  const seconds = diffSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Generate a random string for QR codes, etc.
 *
 * @param length - The length of the string
 */
export function generateRandomString(length: number = 8): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Slugify a string for URLs
 *
 * @param text - The text to slugify
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Delay execution for a specified time
 * Useful for debouncing or testing
 *
 * @param ms - Milliseconds to wait
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if a value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
