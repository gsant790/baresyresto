"use client";

import { SessionProvider } from "next-auth/react";
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";
import type { ReactNode } from "react";
import { TRPCProvider } from "@/lib/trpc/provider";

/**
 * Root Providers Component
 *
 * Wraps the application with all necessary context providers:
 * - NextAuth SessionProvider for authentication state
 * - NextIntl for client-side translations
 * - tRPC Provider for typed API calls
 *
 * This component is used in the root layout to ensure all
 * providers are available throughout the application.
 */

interface ProvidersProps {
  children: ReactNode;
  locale: string;
  messages: AbstractIntlMessages;
}

export function Providers({ children, locale, messages }: ProvidersProps) {
  return (
    <SessionProvider>
      <TRPCProvider>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </TRPCProvider>
    </SessionProvider>
  );
}

export default Providers;
