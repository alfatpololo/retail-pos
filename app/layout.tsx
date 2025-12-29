import type { Metadata } from "next";
import "./globals.css";
import { PrinterProvider } from "@/components/PrinterProvider";
import ThemeLoader from "@/components/ThemeLoader";

export const metadata: Metadata = {
  title: "MKasir - Retail POS System",
  description: "Modern Point of Sale System for Minimarket",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50" suppressHydrationWarning>
        <ThemeLoader />
        <PrinterProvider>{children}</PrinterProvider>
      </body>
    </html>
  );
}

