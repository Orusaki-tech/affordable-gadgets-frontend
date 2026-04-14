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

function collectCssVarsDeclared(cssText) {
  const vars = new Set();
  const re = /^\s*(--[a-zA-Z0-9_-]+)\s*:/gm;
  let m;
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(cssText))) vars.add(m[1]);
  return vars;
}

function collectVarUsages(cssText) {
  const vars = [];
  const re = /var\(\s*(--[a-zA-Z0-9_-]+)/g;
  let m;
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(cssText))) vars.push(m[1]);
  return vars;
}

function stripCssComments(cssText) {
  return cssText.replace(/\/\*[\s\S]*?\*\//g, "");
}

function stripQuotedStrings(cssText) {
  // crude but effective: replace quoted contents with empty quotes so we don't flag colors inside URLs/SVGs.
  return cssText
    .replace(/"([^"\\]|\\.)*"/g, '""')
    .replace(/'([^'\\]|\\.)*'/g, "''");
}

function addUsage(map, key, fileRel, sample) {
  const prev = map.get(key);
  if (!prev) map.set(key, { count: 1, files: new Set([fileRel]), samples: sample ? new Set([sample]) : new Set() });
  else {
    prev.count += 1;
    prev.files.add(fileRel);
    if (sample) prev.samples.add(sample);
  }
}

function findColorLiterals(cssText) {
  const cleaned = stripQuotedStrings(stripCssComments(cssText));

  // hex: #rgb/#rgba/#rrggbb/#rrggbbaa
  const hexRe = /#[0-9a-fA-F]{3,4}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{8}\b/g;

  // rgb/rgba/hsl/hsla
  const fnRe = /\b(?:rgb|rgba|hsl|hsla)\(\s*[^)]+\)/g;

  const out = [];
  let m;
  // eslint-disable-next-line no-cond-assign
  while ((m = hexRe.exec(cleaned))) out.push(m[0]);
  // eslint-disable-next-line no-cond-assign
  while ((m = fnRe.exec(cleaned))) out.push(m[0].replace(/\s+/g, " ").trim());

  return out;
}

function findBoxShadowLiterals(cssText) {
  const cleaned = stripQuotedStrings(stripCssComments(cssText));
  const re = /\bbox-shadow\s*:\s*([^;]+);/g;
  const out = [];
  let m;
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(cleaned))) out.push(m[1].replace(/\s+/g, " ").trim());
  return out;
}

function formatTopList(title, entries, { max = 120 } = {}) {
  const lines = [];
  lines.push("");
  lines.push(`## ${title} (${entries.length})`);
  for (const e of entries.slice(0, max)) {
    const files = [...e.files].slice(0, 8);
    const more = e.files.size > files.length ? ` (+${e.files.size - files.length} more)` : "";
    const sample = e.samples && e.samples.size ? ` | samples: ${[...e.samples].slice(0, 3).join(" ; ")}` : "";
    lines.push(`- ${e.key} (uses: ${e.count}, files: ${files.join(", ")}${more}${sample})`);
  }
  if (entries.length > max) lines.push(`- ... ${entries.length - max} more`);
  return lines.join("\n");
}

async function main() {
  const tokensCss = normalizeNewlines(await fs.readFile(tokensCssPath, "utf8"));
  const tokenVars = collectCssVarsDeclared(tokensCss);

  const files = (await listFilesRecursive(stylesDir)).filter((p) => p.endsWith(".css"));
  const skip = new Set([tokensCssPath]);

  const nonTokenVarUsages = new Map(); // var -> meta
  const literalColors = new Map(); // literal -> meta
  const boxShadows = new Map(); // value -> meta

  for (const file of files) {
    if (skip.has(file)) continue;
    const rel = path.relative(repoRoot, file);
    const css = normalizeNewlines(await fs.readFile(file, "utf8"));

    // (1) var() usages not in tokens.css
    for (const v of collectVarUsages(css)) {
      if (tokenVars.has(v)) continue;
      addUsage(nonTokenVarUsages, v, rel);
    }

    // (2) literals (colors + shadow values)
    for (const lit of findColorLiterals(css)) addUsage(literalColors, lit, rel);
    for (const shadow of findBoxShadowLiterals(css)) addUsage(boxShadows, shadow, rel, shadow);
  }

  const toEntries = (map) =>
    [...map.entries()]
      .map(([key, meta]) => ({ key, ...meta }))
      .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));

  const nonTokenVarEntries = toEntries(nonTokenVarUsages);
  const literalColorEntries = toEntries(literalColors);
  const boxShadowEntries = toEntries(boxShadows);

  const lines = [];
  lines.push(`# Token Gaps Report`);
  lines.push(`Scanned: ${path.relative(repoRoot, stylesDir)}/**/*.css`);
  lines.push(`Compared against token vars in: ${path.relative(repoRoot, tokensCssPath)}`);
  lines.push("");
  lines.push(`Token vars found: ${tokenVars.size}`);
  lines.push(`Non-token CSS vars referenced via var(--*): ${nonTokenVarEntries.length}`);
  lines.push(`Raw color literals found: ${literalColorEntries.length}`);
  lines.push(`Raw box-shadow declarations found: ${boxShadowEntries.length}`);

  lines.push(formatTopList("Non-token CSS variables referenced (need tokens or removal)", nonTokenVarEntries));
  lines.push(formatTopList("Raw color literals (should be replaced with tokens)", literalColorEntries));
  lines.push(formatTopList("Raw box-shadow values (should be tokenized)", boxShadowEntries));

  process.stdout.write(lines.join("\n") + "\n");
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

