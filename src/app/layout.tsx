import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppearanceProvider from "@/components/AppearanceProvider";

export const metadata: Metadata = {
  title: "Salve Maria",
  description: "Aplikacja Fundacji Instytut Edukacji Społecznej i Religijnej im. Ks. Piotra Skargi",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Salve Maria",
  },
};

export const viewport: Viewport = {
  themeColor: "#7f1d1d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <head>
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen bg-slate-900 text-slate-100">
        <AppearanceProvider />
        {children}
      </body>
    </html>
  );
}
