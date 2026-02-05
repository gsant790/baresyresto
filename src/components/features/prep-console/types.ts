/**
 * Prep Console Type Definitions
 *
 * Centralized type definitions for the kitchen/bar preparation console.
 */

import type { OrderItemStatus } from "@prisma/client";

/**
 * Individual item within an order
 */
export interface OrderCardItem {
  id: string;
  dishId: string;
  dishName: string;
  dishNameEn?: string | null;
  quantity: number;
  notes?: string | null;
  status: OrderItemStatus;
  allergens: string[];
}

/**
 * Complete order data for display in prep console
 */
export interface OrderCardData {
  orderId: string;
  orderNumber: number;
  tableNumber: number;
  tableName?: string | null;
  createdAt: Date | string;
  customerNotes?: string | null;
  items: OrderCardItem[];
  status: OrderItemStatus;
}

/**
 * Orders grouped by status for Kanban board
 */
export interface GroupedOrders {
  pending: OrderCardData[];
  inProgress: OrderCardData[];
  ready: OrderCardData[];
}

/**
 * Console statistics
 */
export interface ConsoleStats {
  pending: number;
  inProgress: number;
  ready: number;
}

/**
 * Console header translations
 */
export interface HeaderTranslations {
  title: string;
  newOrders: string;
  inPrep: string;
  ready: string;
  avgTime: string;
  online: string;
  offline: string;
  logout: string;
}

/**
 * Order card translations
 */
export interface OrderTranslations {
  table: string;
  order: string;
  startPrep: string;
  markReady: string;
  markServed: string;
  allergyWarning: string;
  noOrders: string;
}

/**
 * Complete prep console translations
 */
export interface PrepConsoleTranslations extends HeaderTranslations, OrderTranslations {}

/**
 * Sector codes for kitchen/bar
 */
export type SectorCode = "KITCHEN" | "BAR";

/**
 * Connection quality levels
 */
export type ConnectionQuality = "excellent" | "good" | "poor" | "offline";

/**
 * Timer urgency levels
 */
export type UrgencyLevel = "normal" | "warning" | "urgent";

/**
 * Action callback type for order status changes
 */
export type OrderActionHandler = (
  orderId: string,
  itemIds: string[],
  newStatus: OrderItemStatus
) => void | Promise<void>;

/**
 * Logout callback type
 */
export type LogoutHandler = () => void | Promise<void>;
