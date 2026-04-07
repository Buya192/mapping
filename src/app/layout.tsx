import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "PLN Jarkom - Sistem Manajemen Jaringan",
  description: "Sistem pemetaan dan monitoring jaringan kelistrikan PLN",
  manifest: "/manifest.json",
  themeColor: "#0a0e1a",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

import { StoreInitializer } from "@/components/layout/StoreInitializer";
import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossOrigin="anonymous" />
      </head>
      <body>
        <StoreInitializer />
        <Toaster position="top-right" />
        <Navbar />
        <main className="main-content">
          {children}
        </main>
      </body>
    </html>
  );
}
