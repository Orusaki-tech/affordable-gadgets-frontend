/**
 * Rasterize large exported SVG trust stamps to small WebPs in public/.
 * Copy source SVGs into public/images/trust-stamps/ (e.g. new.svg), then run:
 *   npm run rasterize:trust-stamps
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const dir = path.join(root, 'public', 'images', 'trust-stamps');

const PAIRS = [
  ['new.svg', 'new.webp'],
  ['refurbished.svg', 'refurbished.webp'],
  ['pre-owned.svg', 'pre-owned.webp'],
];

const WIDTH = 200;

async function main() {
  for (const [srcName, destName] of PAIRS) {
    const inPath = path.join(dir, srcName);
    const outPath = path.join(dir, destName);
    if (!fs.existsSync(inPath)) {
      console.warn(`Skip (missing): ${srcName}`);
      continue;
    }
    await sharp(inPath)
      .resize(WIDTH, WIDTH, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 86 })
      .toFile(outPath);
    const { size } = fs.statSync(outPath);
    console.log(`${destName}  ${size} bytes`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
