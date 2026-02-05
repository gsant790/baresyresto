import { router } from "@/lib/trpc/init";
import { tablesRouter } from "./tables";
import { inventoryRouter } from "./inventory";
import { prepSectorsRouter } from "./prep-sectors";
import { prepStationRouter } from "./prep-station";
import { categoriesRouter } from "./categories";
import { menuRouter } from "./menu";
import { ordersRouter } from "./orders";
import { paymentsRouter } from "./payments";

/**
 * Root tRPC Router
 *
 * Combines all feature routers into a single app router.
 * Each router handles a specific domain of the application.
 */
export const appRouter = router({
  tables: tablesRouter,
  inventory: inventoryRouter,
  prepSectors: prepSectorsRouter,
  prepStation: prepStationRouter,
  categories: categoriesRouter,
  menu: menuRouter,
  orders: ordersRouter,
  payments: paymentsRouter,
});

export type AppRouter = typeof appRouter;
