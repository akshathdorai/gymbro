import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegistrar } from "@/components/layout/ServiceWorkerRegistrar";
import "./globals.css";

export const metadata: Metadata = {
  title: "GymBro — Your AI Personal Trainer",
  description: "A direct, no-BS AI personal trainer that tracks your progress and holds you accountable.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GymBro",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0f",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full dark">
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('gymbro-theme');if(t==='light')document.documentElement.classList.add('light');})()` }} />
      </head>
      <body className="h-full antialiased overscroll-none">
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  );
}
