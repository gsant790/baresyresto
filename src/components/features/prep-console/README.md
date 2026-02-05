# Prep Console Components

Kitchen and bar preparation console components for managing order workflows with a Kanban-style interface.

## Components

### 1. PrepConsoleHeader (KitchenHeader)

Console header showing station info, real-time stats, and system status.

**Props:**
```typescript
interface PrepConsoleHeaderProps {
  sectorName: string;              // e.g., "Cocina Principal"
  sectorCode: "KITCHEN" | "BAR";
  stats: {
    pending: number;
    inProgress: number;
    ready: number;
  };
  avgTicketTime?: number;          // Average time in seconds
  isOnline?: boolean;              // Connection status
  latency?: number;                // Connection latency in ms
  onLogout?: () => void;           // Logout callback
  lastUpdated?: Date;
  isRefetching?: boolean;
  translations: {
    title: string;
    newOrders: string;
    inPrep: string;
    ready: string;
    avgTime: string;
    online: string;
    offline: string;
    logout: string;
  };
}
```

**Features:**
- Live current time (updates every second)
- Average ticket time display
- Online/offline status with connection latency
- Order stats with color-coded badges
- Logout button
- Responsive design for tablet use

**Usage:**
```tsx
<PrepConsoleHeader
  sectorName="Cocina Principal"
  sectorCode="KITCHEN"
  stats={{ pending: 3, inProgress: 2, ready: 1 }}
  avgTicketTime={420}
  isOnline={true}
  latency={45}
  onLogout={handleLogout}
  translations={t}
/>
```

---

### 2. KanbanBoard

Three-column Kanban board for order management: NEW → IN PREP → READY

**Props:**
```typescript
interface KanbanBoardProps {
  orders: {
    pending: OrderCardData[];
    inProgress: OrderCardData[];
    ready: OrderCardData[];
  };
  onAction: (orderId: string, itemIds: string[], newStatus: OrderItemStatus) => void;
  loadingOrderIds: string[];
  translations: { ... };
}
```

**Features:**
- Three scrollable columns
- Status-based color coding
- Empty state handling
- Loading states

**Usage:**
```tsx
<KanbanBoard
  orders={orders}
  onAction={handleStatusChange}
  loadingOrderIds={loadingIds}
  translations={t}
/>
```

---

### 3. OrderCard (OrderTicket)

Individual order card displaying order details and actions.

**Props:**
```typescript
interface OrderCardProps {
  order: OrderCardData;
  onAction: (orderId: string, itemIds: string[], newStatus: OrderItemStatus) => void;
  isLoading?: boolean;
  translations: { ... };
}

interface OrderCardData {
  orderId: string;
  orderNumber: number;
  tableNumber: number;
  tableName?: string | null;
  createdAt: Date | string;
  customerNotes?: string | null;
  items: OrderCardItem[];
  status: OrderItemStatus;
}
```

**Features:**
- Table number prominent display (e.g., "T-4")
- Order number (#ORD-8921)
- Elapsed time with color coding:
  - Green: < 5 minutes
  - Orange: 5-10 minutes
  - Red: > 10 minutes (pulsing)
- Items list with quantities and modifiers
- Allergy warning banner if allergens present
- Status-appropriate action button
- Border color matches status

**Usage:**
```tsx
<OrderCard
  order={orderData}
  onAction={handleAction}
  isLoading={false}
  translations={t}
/>
```

---

### 4. AllergyBadge

Displays allergen warnings with high-contrast styling.

**Props:**
```typescript
interface AllergyBadgeProps {
  allergens: string[];
  className?: string;
  compact?: boolean;
}
```

**Features:**
- Red background for high visibility
- Triangle warning icon
- Allergen list
- Compact mode for inline display
- Localized allergen names

**Usage:**
```tsx
<AllergyBadge allergens={["gluten", "dairy", "nuts"]} />
<AllergyBadge allergens={["fish"]} compact />
```

---

### 5. TicketItem

Individual item display within order tickets.

**Props:**
```typescript
interface TicketItemProps {
  quantity: number;
  name: string;
  notes?: string | null;
  allergens?: string[];
  compact?: boolean;
  className?: string;
}
```

**Features:**
- Quantity badge
- Item name
- Special notes/modifiers (indented, orange text)
- Inline allergen warnings
- Compact mode

**Usage:**
```tsx
<TicketItem
  quantity={2}
  name="Hamburguesa Clásica"
  notes="Sin cebolla, extra queso"
  allergens={["gluten", "dairy"]}
/>
```

---

### 6. ElapsedTimer

Live elapsed time display updating every second.

**Props:**
```typescript
interface ElapsedTimerProps {
  startTime: Date | string;
  className?: string;
  large?: boolean;
}
```

**Features:**
- Updates every second
- MM:SS format
- Color-coded urgency:
  - Normal: < 5 min
  - Warning: 5-10 min (orange)
  - Urgent: > 10 min (red, pulsing)
- Monospace font for readability

**Usage:**
```tsx
<ElapsedTimer startTime={order.createdAt} large />
```

---

### 7. KanbanColumn

Single column in the Kanban board.

**Props:**
```typescript
interface KanbanColumnProps {
  title: string;
  orders: OrderCardData[];
  status: OrderItemStatus;
  onAction: (orderId: string, itemIds: string[], newStatus: OrderItemStatus) => void;
  loadingOrderIds: string[];
  translations: { ... };
}
```

**Features:**
- Color-coded header
- Order count badge
- Scrollable content
- Empty state with icon

---

## Responsive Breakpoints

All components are optimized for tablet use (landscape orientation recommended):

- **Mobile**: < 640px - Compact mode
- **Tablet**: 640px - 1024px - Optimal for prep consoles
- **Desktop**: > 1024px - Full features visible

## Accessibility

- Semantic HTML elements
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus indicators
- High contrast for allergen warnings
- Readable font sizes (min 12px)

## Color Coding

### Status Colors
- **NEW (PENDING)**: Blue (#3b82f6)
- **IN PREP (IN_PROGRESS)**: Orange (#f59e0b)
- **READY**: Green (#22c55e)

### Urgency Colors
- **Normal**: Text secondary
- **Warning**: Orange (#f59e0b)
- **Urgent**: Red (#ef4444)

### Allergen Warnings
- **Background**: Red 600/90 (#dc2626)
- **Text**: White
- **Icon**: Warning triangle

## Dark Theme

All components are designed for dark theme by default:
- Background: `#231810`
- Surface: `#2d2018`
- Card: `#362921`
- Text Primary: `#ffffff`
- Text Secondary: `#cba990`

## Performance

- Memoized components prevent unnecessary re-renders
- Virtual scrolling for large order lists (future enhancement)
- Optimized timer updates (only affected components)
- Efficient state management

## Example Implementation

See `prep-console.example.tsx` for a complete working example.

```tsx
import { PrepConsoleHeader, KanbanBoard } from "@/components/features/prep-console";

export function KitchenConsole() {
  return (
    <div className="min-h-screen bg-background-dark">
      <PrepConsoleHeader {...headerProps} />
      <main className="p-6 h-[calc(100vh-100px)]">
        <KanbanBoard {...boardProps} />
      </main>
    </div>
  );
}
```

## Testing

Key test scenarios:
1. Timer updates correctly
2. Status transitions work
3. Allergen warnings display prominently
4. Responsive layout on different screen sizes
5. Loading states show correctly
6. Empty states render properly
7. Keyboard navigation works
8. Color contrast meets WCAG AA

## Future Enhancements

- Drag and drop between columns
- Sound notifications for new orders
- Print ticket functionality
- Order filtering and search
- Multi-station support
- Order notes/comments
- Time-based automatic status updates
