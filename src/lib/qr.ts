import { nanoid } from "nanoid";

/**
 * QR Code Generation Utilities
 *
 * Handles generating unique table codes and building URLs for QR code scanning.
 * Table codes are 6-character uppercase alphanumeric strings that are globally
 * unique and used to route customers to the correct table menu.
 */

/**
 * Generate a unique 6-character table code for QR routing.
 *
 * Uses nanoid for cryptographically secure random generation.
 * The code is uppercase alphanumeric for easy scanning and readability.
 *
 * @returns A unique 6-character uppercase string
 */
export function generateTableCode(): string {
  return nanoid(6).toUpperCase();
}

/**
 * Build the customer-facing menu URL for a table.
 *
 * This URL is encoded in the QR code that customers scan to access
 * the digital menu for their specific table.
 *
 * @param tenantSlug - The restaurant's unique slug identifier
 * @param tableCode - The table's unique QR code
 * @param locale - The locale for the menu (default: 'es')
 * @returns The full URL for the table's menu
 *
 * @example
 * buildTableUrl('mi-restaurante', 'ABC123')
 * // => 'http://localhost:3000/es/menu/mi-restaurante/ABC123'
 */
export function buildTableUrl(
  tenantSlug: string,
  tableCode: string,
  locale: string = "es"
): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}/${locale}/menu/${tenantSlug}/${tableCode}`;
}

/**
 * Validate a table code format.
 *
 * Table codes should be 6 uppercase alphanumeric characters.
 *
 * @param code - The code to validate
 * @returns True if the code format is valid
 */
export function isValidTableCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code);
}
