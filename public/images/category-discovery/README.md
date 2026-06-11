# Category discovery images

Discover section art is served from **Cloudinary** via `CloudinaryImage` presets (see `lib/config/image-presets.ts`).

- **Hero:** `category-discovery/discover-hero` on Cloudinary; local `hero.png` is offline fallback only.
- **Cards:** `category-discovery/cards/*` on Cloudinary.

Local JPEGs in this folder are legacy sources; config URLs in `lib/config/category-discovery.ts` point at Cloudinary.
