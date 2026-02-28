# Products loading: performance and time-to-display

## Does `prefetch={false}` improve performance?

**Yes, but in a specific way.**

| What improves | What doesn’t |
|---------------|--------------|
| **Pages that show many product links** (homepage, header, categories): fewer parallel requests, less bandwidth contention, faster Time to Interactive, less server load. | **The products page itself**: when the user clicks “Products” or a category, that one request still runs on navigation. Click-to-content time is unchanged. |

So you get a clear win on **initial load** of any page that has the header/category links (no more 30+ prefetches). The **time until the product grid appears after opening /products** is driven by the single products API request and the backend, not by prefetch.

---

## Why does it take long for products to return and the UI to populate?

End-to-end flow:

1. **User navigates to `/products` or `/products?type=PH&brand=Apple`.**
2. **Next.js loads the products route** → `ProductsPage` (client component) mounts.
3. **`useProducts(...)` runs** with `page`, `page_size`, `type`, `brand_filter`, etc. from URL.
4. **React Query fires one GET** to `/api/v1/public/products/?page=1&page_size=12&type=...&brand=...`.
5. **UI shows loading state** (skeletons) until that request resolves.
6. **When the response arrives**, React Query updates state and the grid renders.

So **“how long until the UI is populated”** is effectively:

- **Network latency** (round-trip to your API)
- **Backend time** (time to build the response)
- **Plus** a tiny amount of React render time (usually negligible)

The frontend does **not** wait for multiple requests: one list request per filter set, and `keepPreviousData` keeps the previous list visible while refetching (e.g. when changing filters), which already helps perceived speed.

---

## Where time is spent

### Backend (Django)

- **Cache**: List responses are cached (key = `X-Brand-Code` + query params). **Cache hit** → response is very fast. **Cache miss** → full `get_queryset()` + serialization.
- **Query**: Filters, annotations (min_price, max_price, review counts, etc.), prefetches (images, units, bundles, reviews). With a lot of products and relations, this can be hundreds of ms.
- **Logging**: The backend logs something like:  
  `public_products_list completed in Xms (page=1 page_size=12)`  
  so you can see exactly how long each list request took on the server.

So “long time to return” is usually either:

- First request (or new filter) → **cache miss** + heavy query/serialization, or  
- Slow DB (missing indexes, N+1, or large result set).

### Frontend

- The **only** thing that delays “products on screen” is waiting for that **one** list API response. There is no extra delay from prefetch anymore (we turned it off for filter/category links).
- After the response is in, React Query updates and the grid renders immediately; no secondary “populate” step.

---

## How to measure

1. **Backend duration**  
   In Django logs, look for:  
   `public_products_list completed in Xms (page=... page_size=...)`  
   That’s the server-side time for the list endpoint.

2. **End-to-end (browser)**  
   In DevTools → Network: select the `products?...` request (or `public/products/`) and check:  
   - **Waiting (TTFB)** ≈ backend + network.  
   - **Content Download** = transferring the JSON.

3. **When content appears**  
   React Query DevTools: see when the `products` query goes from `pending` to `success`; that’s when the UI will show the grid (plus one render).

---

## Why is the frontend slower than “just” the API call?

When you open `/products`, the **total time until you see the list** is longer than a single `products/?page=1&page_size=12` request. That’s expected.

### 1. **Work that happens before the API is called**

The products API is only called **after** the frontend is ready to run it:

1. Browser requests the page from **Vercel** (HTML/document).
2. Browser downloads and parses **JS bundles** (Next.js, React, your app).
3. **Hydration**: React runs and mounts the tree; `ProductsPage` (client component) mounts.
4. **Then** `useProducts()` runs and the **first** request to your backend is sent.

So:

**Time until products visible** ≥ **(document + JS + hydration)** + **(API TTFB)** + **(one render)**.

A raw API check (e.g. `curl` or `scripts/check_cold_start.py`) only measures the API. The frontend adds everything in step 1–3 before that request even starts, so the **same** API will appear “slower” when measured from page load.

### 2. **Multiple requests on the same page**

On `/products` the page doesn’t only call the products list:

- **Products list** – `products/?page=1&page_size=12` (this is what blocks the grid).
- **Header** – may request **brands** for the dropdown.
- **Product cards** – after the list loads, **units** (and possibly detail) are requested for visible items.

So in the Network tab you see:

- More requests than “one API call”.
- Total time or “last request finished” can be **longer** than the single products request, because other calls (brands, units) also take time and can finish later.

The **critical path** for “products on screen” is still the **products list** request; the rest add to total load and to the number/duration of requests you see.

### 3. **Cold start and waterfalls**

If the backend is on Railway (or similar) and goes to sleep:

- **First** request (e.g. products or brands) can be very slow (cold start).
- Other requests that start around the same time **queue behind** the waking instance, so they also finish late.

So “frontend time” can look like 30+ seconds even if a single warm API call would be ~3 s: the first request pays the cold start, and the page waits for that (and possibly other) requests before feeling “done”.

### Summary

| What you measure | What it includes |
|------------------|------------------|
| **Single API call** (script or `curl`) | Only backend + network for that request. |
| **Frontend “time until products”** | Document + JS + hydration + **then** products API + render (and possibly brands/units). |
| **Frontend Network tab “total”** | All requests (products, brands, units, etc.); last one can be much later than the products request alone. |

So the frontend is **expected** to be slower than “just the API”: it includes bootstrap (HTML/JS/hydration), the same API call, and often more API calls (brands, units). To improve **perceived** speed, focus on: backend (and cold start), then keeping the critical path to a single products request and avoiding extra blocking work before that request is sent.

---

## Summary

- **Prefetch change** → real performance improvement on **homepage / any page with many product links** (fewer requests, faster load). It does **not** shorten the time to see products **after** you open the products page.
- **Time to populate the products UI** = time until the **single** products list API response returns (backend + network), then the UI updates right away. To improve that, focus on **backend** (cache usage, query/index tuning) and **network** (latency, payload size), not on prefetch.
