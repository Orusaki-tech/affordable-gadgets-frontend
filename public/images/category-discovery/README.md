# Category discovery images

Discover section art is served from **Cloudinary** via `CloudinaryImage` presets (see `lib/config/image-presets.ts`).

- **Hero:** `category-discovery/discover-hero` on Cloudinary; local `hero.png` is offline fallback only.
- **Cards:** `category-discovery/cards/*` on Cloudinary.

## Uploading new card images

1. Save source files in `cards/` using these exact stems (`.jpg`, `.jpeg`, `.png`, or `.webp`):
   - `iphone`, `ipad`, `watch`, `airpods`, `mac-laptops`, `mac-desktops`
2. From the frontend repo root, run:

```bash
chmod +x scripts/upload-category-discovery-cards.sh
./scripts/upload-category-discovery-cards.sh
```

Credentials are read from `../affordable-gadgets-backend/.env` (`CLOUDINARY_*`), same as other marketing uploads in this project.

3. Copy the printed `secure_url` values into `lib/config/category-discovery.ts`, or auto-update:

```bash
./scripts/upload-category-discovery-cards.sh --write-config
```

4. Update each card’s `alt` text in `category-discovery.ts` if the artwork changes.

Config URLs in `lib/config/category-discovery.ts` are the runtime source of truth; local files in `cards/` are upload sources only (not served by Next.js in production).
