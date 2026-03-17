export const runtime = "nodejs";

function getBackendFeedUrl() {
  const base = process.env.MERCHANT_FEED_BACKEND_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) return null;
  return `${base.replace(/\/+$/, "")}/feeds/google-products.xml`;
}

export async function GET() {
  const url = getBackendFeedUrl();
  if (!url) {
    return new Response("Missing MERCHANT_FEED_BACKEND_BASE_URL", { status: 500 });
  }

  const upstream = await fetch(url, {
    // Keep it fresh; Merchant Center will fetch on schedule anyway.
    cache: "no-store",
    headers: {
      "User-Agent": "AffordableGadgetsFeedProxy/1.0",
      Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
    },
  });

  const body = await upstream.text();

  // Pass through status but ensure content-type is XML for Merchant Center.
  return new Response(body, {
    status: upstream.status,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      // Avoid caching mismatches between Vercel edge/CDN and upstream.
      "Cache-Control": "no-store",
    },
  });
}

