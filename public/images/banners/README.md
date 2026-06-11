# Products page brand banners

Background images for `/products?brand_filter=…` hero banners. Headline and **Buy Now** are rendered in HTML on top.

## Current assets

| File | Brand (`brand_filter`) |
|------|------------------------|
| Cloudinary `products-banners/iphone` (8000×1800 master) | Apple (nav: iPhone) |
| `samsung.jpg` | Samsung |

Google and Sony use a gray fallback until you add `google.jpg` / `sony.jpg`.

## Specs for new banners

- **Size:** **1280×288 px** at 1× (Back Market `min-h-72` strip); export **2560×576** for Retina
- **Format:** JPEG or WebP
- **No baked-in headline text** (use HTML overlay in the app)

Update paths in `lib/config/products-brand-banners.ts` when adding files.
