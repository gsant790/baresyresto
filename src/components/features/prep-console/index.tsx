/**
 * Prep Console Components
 *
 * Kitchen and bar preparation console components.
 * Used for managing order workflows with a Kanban-style interface.
 */

export { PrepConsoleHeader } from "./prep-console-header";
export { KanbanBoard } from "./kanban-board";
export { KanbanColumn } from "./kanban-column";
export { OrderCard } from "./order-card";
export { AllergyBadge } from "./allergy-badge";
export { ElapsedTimer } from "./elapsed-timer";
export { TicketItem } from "./ticket-item";
export { SoundNotification, useSoundNotification } from "./sound-notification";

// Export types from order-card for backwards compatibility
export type { OrderCardData, OrderCardItem } from "./order-card";

// Export all types from the types file
export type {
  GroupedOrders,
  ConsoleStats,
  HeaderTranslations,
  OrderTranslations,
  PrepConsoleTranslations,
  SectorCode,
  ConnectionQuality,
  UrgencyLevel,
  OrderActionHandler,
  LogoutHandler,
} from "./types";
