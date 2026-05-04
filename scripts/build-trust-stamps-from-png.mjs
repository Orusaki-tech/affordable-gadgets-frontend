/**
 * Build public trust-stamp WebPs from PNGs in public/images/trust-stamps/_sources/.
 * Source PNGs are RGB (no alpha) with solid black outside the seal: we trim edges,
 * key near-black to transparent, resize, write WebP with alpha.
 *
 *   npm run build:trust-stamps
 *
 * Tune chroma key: TRUST_STAMP_KEY_THRESHOLD=35 node scripts/build-trust-stamps-from-png.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'public', 'images', 'trust-stamps');
const srcDir = path.join(outDir, '_sources');

/** Pixels with R,G,B all ≤ this become fully transparent. */
const BLACK_KEY_THRESHOLD = Number(process.env.TRUST_STAMP_KEY_THRESHOLD || 40);

const MAX_WIDTH = 420;

const PAIRS = [
  ['new.png', 'new.webp'],
  ['pre-owned.png', 'pre-owned.webp'],
  ['refurbished.png', 'refurbished.webp'],
];

async function keyBlackToTransparent(buffer) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const th = BLACK_KEY_THRESHOLD;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r <= th && g <= th && b <= th) {
      data[i + 3] = 0;
    }
  }
  return sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  });
}

async function processOne(srcPath, destName) {
  if (!fs.existsSync(srcPath)) {
    console.warn(`Skip (missing): ${srcPath}`);
    return;
  }
  let buf = await sharp(srcPath).rotate().toBuffer();
  try {
    buf = await sharp(buf).trim({ threshold: 12 }).toBuffer();
  } catch {
    // ignore
  }
  const keyed = await keyBlackToTransparent(buf);
  await keyed
    .resize(MAX_WIDTH, MAX_WIDTH, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85, alphaQuality: 100, effort: 4 })
    .toFile(path.join(outDir, destName));
  const outPath = path.join(outDir, destName);
  const { size } = fs.statSync(outPath);
  const meta = await sharp(outPath).metadata();
  console.log(`${destName}  ${size} bytes  hasAlpha=${meta.hasAlpha}  ${meta.width}x${meta.height}`);
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  for (const [srcName, outName] of PAIRS) {
    await processOne(path.join(srcDir, srcName), outName);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
