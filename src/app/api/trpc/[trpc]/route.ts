import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/lib/trpc/routers";
import { createContext } from "@/lib/trpc/init";

/**
 * tRPC HTTP Handler
 *
 * Handles all tRPC API requests via the Next.js App Router.
 * Supports both GET (queries) and POST (mutations) methods.
 */

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
    onError:
      process.env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(
              `[tRPC Error] ${path ?? "<no-path>"}:`,
              error.message
            );
          }
        : undefined,
  });

export { handler as GET, handler as POST };
