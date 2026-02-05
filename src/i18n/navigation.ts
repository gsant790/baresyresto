import { createNavigation } from "next-intl/navigation";
import { locales, defaultLocale } from "./config";

/**
 * Internationalized Navigation
 *
 * Provides locale-aware versions of Next.js navigation primitives.
 * Use these instead of next/link and next/navigation for proper i18n support.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation({
    locales,
    defaultLocale,
  });
