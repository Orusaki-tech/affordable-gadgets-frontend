import type { MetadataRoute } from "next";
import { brandConfig } from "@/lib/config/brand";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = brandConfig.siteUrl.replace(/\/+$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/cart", "/checkout", "/payment", "/orders"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
