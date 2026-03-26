import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { Providers } from "./providers";
import { brandConfig } from "@/lib/config/brand";
import { StructuredData } from "@/components/StructuredData";
import { GoogleCustomerReviewsBadge } from "@/components/GoogleCustomerReviewsBadge";

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
    description: "Shop quality phones, laptops, tablets, and accessories at great prices",
    images: ["/affordable-social-share.png"],
  },
  icons: {
    icon: [
      { url: "/affordlogo1.svg", type: "image/svg+xml" },
      { url: "/affordable-social-share.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/affordable-social-share.png",
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
        <StructuredData type="Organization" />
        <StructuredData type="WebSite" />
        <StructuredData type="LocalBusiness" />
        <Providers>{children}</Providers>
        <GoogleCustomerReviewsBadge merchantId={5748422735} />
        <SpeedInsights />
      </body>
    </html>
  );
}
