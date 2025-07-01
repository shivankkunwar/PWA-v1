import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PWA Notification Demo",
  description: "A proof-of-concept Progressive Web App demonstrating push notifications for anonymous chat applications",
  manifest: "/manifest.json",
  keywords: ["PWA", "notifications", "push", "demo", "chat", "anonymous"],
  authors: [{ name: "Your Name" }],
  creator: "Your Name",
  publisher: "Your Company",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PWA Notification Demo",
  },
  applicationName: "PWA Notification Demo",
  icons: {
    icon: [
      { url: "/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icon-512x512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
    ],
  },
  openGraph: {
    type: "website",
    siteName: "PWA Notification Demo",
    title: "PWA Notification Demo",
    description: "A proof-of-concept Progressive Web App demonstrating push notifications for anonymous chat applications",
    images: [
      {
        url: "/icon-512x512.svg",
        width: 512,
        height: 512,
        alt: "PWA Notification Demo Icon",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "PWA Notification Demo",
    description: "A proof-of-concept Progressive Web App demonstrating push notifications for anonymous chat applications",
    images: ["/icon-512x512.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PWA Notification Demo" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
