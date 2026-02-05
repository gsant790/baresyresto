"use client";

import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/lib/trpc/routers";

/**
 * tRPC React Client
 *
 * Provides typed hooks for data fetching in React components.
 * Use `api.routerName.procedureName` to call procedures.
 *
 * @example
 * const { data: tables } = api.tables.list.useQuery();
 * const createTable = api.tables.create.useMutation();
 */
export const api = createTRPCReact<AppRouter>();
