import type { Metadata, Viewport } from "next";
import { QueryProvider } from "@/components/QueryProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "SUVIDHA ONE - Unified Citizen Service Portal",
  description: "One Kiosk, All Services - Suvidha Sabke Liye - Digital India Initiative",
  keywords: "citizen services, digital india, e-governance, bill payment, certificates",
  authors: [{ name: "SUVIDHA ONE Team" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#1A3C8F",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          src="https://checkout.razorpay.com/v1/checkout.js"
          async
        ></script>
      </head>
      <body className="antialiased bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
