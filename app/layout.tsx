import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { Providers } from "./providers";
import { brandConfig } from "@/lib/config/brand";
import { StructuredData } from "@/components/StructuredData";
import { GoogleCustomerReviewsBadge } from "@/components/GoogleCustomerReviewsBadge";
import { AuthGate } from "@/components/AuthGate";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: brandConfig.name,
    template: `%s | ${brandConfig.name}`,
  },
  description: "Premium smartphones, laptops and accessories from Apple iPhone, Samsung, Google Pixel, Sony Xperia, OnePlus and more. Best deals in Kenya. Visit Kimathi St, Nairobi.",
  keywords: ["iPhone", "Samsung", "Google Pixel", "Sony", "OnePlus", "phones", "laptops", "tablets", "accessories", "electronics", "Kenya"],
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
        url: "/affordable-social-share.png",
        width: 1200,
        height: 630,
        alt: `${brandConfig.name} logo`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: brandConfig.name,
    description: "Premium smartphones, laptops and accessories from Apple iPhone, Samsung, Google Pixel, Sony Xperia, OnePlus and more. Best deals in Kenya.",
    images: ["/affordable-social-share.png"],
  },
  icons: {
    icon: [
      { url: "/favicon-circle.svg", type: "image/svg+xml" },
      { url: "/favicon-phone.ico", type: "image/x-icon" },
      { url: "/favicon-phone-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/affordable-social-share.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const apiOrigin = (() => {
    try {
      return new URL(brandConfig.apiBaseUrl).origin;
    } catch {
      return 'https://api.affordable-gadgetske.com';
    }
  })();

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="preconnect" href={apiOrigin} />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href={apiOrigin} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <StructuredData type="Organization" />
        <StructuredData type="WebSite" />
        <StructuredData type="LocalBusiness" />
        <Providers>
          <AuthGate>
            {children}
          </AuthGate>
        </Providers>
        <GoogleCustomerReviewsBadge merchantId={5748422735} />
        <SpeedInsights />
      </body>
    </html>
  );
}
