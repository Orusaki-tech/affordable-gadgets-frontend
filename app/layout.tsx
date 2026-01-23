import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { Providers } from "./providers";
import { brandConfig } from "@/lib/config/brand";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: brandConfig.name,
    template: `%s | ${brandConfig.name}`,
  },
  description: "Shop quality phones, laptops, tablets, and accessories at great prices",
  keywords: ["phones", "laptops", "tablets", "electronics", "accessories"],
  metadataBase: new URL(brandConfig.siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_KE",
    siteName: brandConfig.name,
    url: brandConfig.siteUrl,
    images: [
      {
        url: "/affordablegadgetslogo.png",
        width: 1200,
        height: 630,
        alt: `${brandConfig.name} logo`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: brandConfig.name,
    description: "Shop quality phones, laptops, tablets, and accessories at great prices",
    images: ["/affordablegadgetslogo.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/affordablegadgetslogo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
