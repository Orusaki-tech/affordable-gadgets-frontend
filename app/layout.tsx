import type { Metadata } from "next";
import { Geist, Geist_Mono, Roboto } from "next/font/google";
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

/** Weights match our Material typography roles (Regular / Medium / Bold). */
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto-loaded",
  display: "swap",
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
  return (
    <html lang="en">
      <body
        className={`${roboto.variable} ${geistSans.variable} ${geistMono.variable} u-antialiased`}
      >
        <div className="site-route-shell">
          <StructuredData type="Organization" />
          <StructuredData type="WebSite" />
          <StructuredData type="LocalBusiness" />
          <Providers>{children}</Providers>
        </div>
        <GoogleCustomerReviewsBadge merchantId={5748422735} />
        <SpeedInsights />
      </body>
    </html>
  );
}
