# Products page brand banners

Background images for `/products?brand_filter=…` hero banners (text is rendered in HTML, not baked into the image).

## Recommended specs

- **Size:** ~1280×400 px (wide hero), or similar ~3:1 aspect ratio
- **Format:** JPEG or WebP, no headline text in the image
- **Filenames** (referenced in `lib/config/products-brand-banners.ts`):

| Brand filter | Suggested file | Nav title |
|--------------|----------------|-----------|
| Apple | `iphone.jpg` | iPhone |
| Samsung | `samsung.jpg` | Samsung |
| Google | `google.jpg` | Google |
| Sony | `sony.jpg` | Sony |

Until `google.jpg` / `sony.jpg` are uploaded, those pages use a gray fallback background. Apple/Samsung may use legacy `apple-1.png` / `samsung-1.png` until you replace them.

## Home page

- **featured-banner.jpg** — optional static image for `CollectionHeaderBanner` on the homepage.
