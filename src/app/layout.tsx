import type { Metadata, Viewport } from "next";
import "./globals.css";

/**
 * Root Layout
 *
 * This is the outermost layout that wraps the entire application.
 * The actual content and providers are set up in the [locale] layout
 * to ensure proper internationalization support.
 *
 * This layout only sets up the HTML structure and global metadata.
 */

export const metadata: Metadata = {
  title: {
    default: "BaresyResto",
    template: "%s | BaresyResto",
  },
  description:
    "Multi-tenant restaurant management platform with digital menus, order management, and kitchen display systems.",
  keywords: [
    "restaurant",
    "menu",
    "orders",
    "kitchen",
    "management",
    "SaaS",
    "multi-tenant",
  ],
  authors: [{ name: "BaresyResto" }],
  creator: "BaresyResto",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    locale: "es_ES",
    alternateLocale: "en_US",
    siteName: "BaresyResto",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f7f5" },
    { media: "(prefers-color-scheme: dark)", color: "#231810" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
