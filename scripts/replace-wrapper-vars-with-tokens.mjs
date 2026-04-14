import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const stylesDir = path.join(repoRoot, "styles");
const tokensCssPath = path.join(stylesDir, "tokens", "generated", "tokens.css");

function normalizeNewlines(s) {
  return s.replace(/\r\n/g, "\n");
}

async function listFilesRecursive(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...(await listFilesRecursive(full)));
    else out.push(full);
  }
  return out;
}

function parseTokenColors(tokensCssText) {
  // Map color value -> token var name (prefer semantic-like names if duplicates exist)
  const valueToVar = new Map();
  const re = /^\s*(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+);\s*$/gm;
  let m;
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(tokensCssText))) {
    const varName = m[1];
    const rawVal = m[2].trim();
    const val = rawVal.toLowerCase();
    // Only handle hex + rgb(a)/hsl(a) as "colors"
    if (!val.startsWith("#") && !val.startsWith("rgb") && !val.startsWith("hsl")) continue;

    const prev = valueToVar.get(val);
    if (!prev) valueToVar.set(val, varName);
    else {
      // Prefer more semantic vars over palette-ish ones (heuristic)
      const score = (v) =>
        (v.startsWith("--surface-") ? 30 : 0) +
        (v.startsWith("--text-color-") ? 30 : 0) +
        (v.startsWith("--border-") ? 20 : 0) +
        (v.startsWith("--icons-") ? 10 : 0) +
        (v.startsWith("--neutral-") ? 5 : 0);
      if (score(varName) > score(prev)) valueToVar.set(val, varName);
    }
  }
  return valueToVar;
}

function replaceHexWrapperVars(cssText, valueToTokenVar) {
  // Replace var(--_hex_xxx, #xxx) -> var(--tokenVar)
  const re = /var\(\s*--_hex_[0-9a-fA-F]+\s*,\s*(#[0-9a-fA-F]{3,4}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{8}\b)\s*\)/g;
  let changed = false;
  const out = cssText.replace(re, (_full, hexLit) => {
    const key = hexLit.toLowerCase();
    const tokenVar = valueToTokenVar.get(key);
    if (!tokenVar) return _full;
    changed = true;
    return `var(${tokenVar})`;
  });
  return { out, changed };
}

function replaceFnRgbaWrapperVars(cssText) {
  // Replace var(--_fn_rgba_..., rgba(...)) with token-derived alpha from black-900/neutral-2-50 when possible.
  // We only convert:
  // - rgba(0,0,0,a) -> rgb(from var(--black-900) r g b / a)
  // - rgba(255,255,255,a) -> rgb(from var(--neutral-2-50) r g b / a)
  const re = /var\(\s*--_fn_rgba_[0-9_]+\s*,\s*rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)\s*\)/g;
  let changed = false;
  const out = cssText.replace(re, (full, r, g, b, a) => {
    const rr = Number(r);
    const gg = Number(g);
    const bb = Number(b);
    const aa = String(a);
    if (rr === 0 && gg === 0 && bb === 0) {
      changed = true;
      return `rgb(from var(--black-900) r g b / ${aa})`;
    }
    if (rr === 255 && gg === 255 && bb === 255) {
      changed = true;
      return `rgb(from var(--neutral-2-50) r g b / ${aa})`;
    }
    return full;
  });
  return { out, changed };
}

async function main() {
  const tokensCss = normalizeNewlines(await fs.readFile(tokensCssPath, "utf8"));
  const valueToTokenVar = parseTokenColors(tokensCss);

  const files = (await listFilesRecursive(stylesDir)).filter((p) => p.endsWith(".css"));
  const skip = new Set([tokensCssPath]);

  let changedFiles = 0;

  for (const file of files) {
    if (skip.has(file)) continue;
    const original = normalizeNewlines(await fs.readFile(file, "utf8"));
    let cur = original;
    let changed = false;

    const a = replaceHexWrapperVars(cur, valueToTokenVar);
    cur = a.out;
    changed = changed || a.changed;

    const b = replaceFnRgbaWrapperVars(cur);
    cur = b.out;
    changed = changed || b.changed;

    if (!changed) continue;
    await fs.writeFile(file, cur, "utf8");
    changedFiles += 1;
  }

  // eslint-disable-next-line no-console
  console.log(`Rewrote wrapper vars in ${changedFiles} CSS files.`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

