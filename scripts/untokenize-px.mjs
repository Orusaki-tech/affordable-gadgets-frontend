import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const stylesRoot = path.join(repoRoot, "styles");
const skipDirs = new Set([path.join(stylesRoot, "tokens", "generated")]);

function isCssFile(p) {
  return p.endsWith(".css");
}

async function* walk(dir) {
  if (skipDirs.has(dir)) return;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      yield* walk(full);
    } else if (e.isFile() && isCssFile(full)) {
      yield full;
    }
  }
}

function untokenizePx(content) {
  // Convert var(--px-24) back to 24px.
  // Supports integers, decimals, and negatives (e.g. var(--px--1), var(--px-0.5))
  return content.replace(/var\(--px-(-?\d+(?:\.\d+)?)\)/g, (_m, n) => `${n}px`);
}

async function main() {
  let changedFiles = 0;

  for await (const filePath of walk(stylesRoot)) {
    const before = await fs.readFile(filePath, "utf8");
    const after = untokenizePx(before);
    if (after !== before) {
      await fs.writeFile(filePath, after, "utf8");
      changedFiles += 1;
    }
  }

  // eslint-disable-next-line no-console
  console.log(`Reverted var(--px-*) to px in ${changedFiles} files.`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

