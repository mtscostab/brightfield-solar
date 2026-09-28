import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { BRAND_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const fraunces = localFont({
  src: [
    { path: "../fonts/fraunces-latin-opsz-normal.woff2", style: "normal", weight: "100 900" },
    { path: "../fonts/fraunces-latin-opsz-italic.woff2", style: "italic", weight: "100 900" },
  ],
  variable: "--font-serif",
  display: "swap",
  fallback: ["Iowan Old Style", "Palatino Linotype", "Georgia", "serif"],
});

const instrumentSans = localFont({
  src: "../fonts/instrument-sans-latin-wght-normal.woff2",
  weight: "400 700",
  variable: "--font-sans",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: BRAND_NAME, template: `%s | ${BRAND_NAME}` },
  applicationName: BRAND_NAME,
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0F3B2E",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-US" className={`${fraunces.variable} ${instrumentSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
