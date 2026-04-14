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

function alphaTokenName(baseVar, alphaRaw) {
  const base = baseVar.replace(/^--/, "");
  const alpha = Number(alphaRaw);
  const pct = Math.round(alpha * 100);
  return `--alpha-${base}-${String(pct).padStart(2, "0")}`;
}

function replaceRgbFromVarAlpha(s) {
  // Replace both wrapped and unwrapped forms:
  // (rgb(from var(--black-900) r g b / 0.12))  -> var(--alpha-black-900-12)
  // rgb(from var(--black-900) r g b / 0.12)    -> var(--alpha-black-900-12)
  const re = /\(?\s*rgb\(from\s+var\((--[a-z0-9-]+)\)\s+r\s+g\s+b\s+\/\s+([0-9.]+)\s*\)\s*\)?/gi;
  return s.replace(re, (_m, baseVar, alpha) => `var(${alphaTokenName(baseVar, alpha)})`);
}

function replacePxWithVarsPerLine(line) {
  // Don't touch media query conditions — CSS vars aren't valid/reliable there.
  if (/^\s*@media\b/i.test(line)) return line;
  // Replace "12px" => "var(--px-12)" (works for negative px too)
  return line.replace(/(-?\b\d+(\.\d+)?)px\b/g, (_m, n) => `var(--px-${n})`);
}

function tokenizeCss(content) {
  const withAlphaTokens = replaceRgbFromVarAlpha(content);
  const lines = withAlphaTokens.split("\n").map(replacePxWithVarsPerLine);
  return lines.join("\n");
}

async function main() {
  let changedFiles = 0;
  let touchedLines = 0;

  for await (const filePath of walk(stylesRoot)) {
    const before = await fs.readFile(filePath, "utf8");
    const after = tokenizeCss(before);
    if (after !== before) {
      await fs.writeFile(filePath, after, "utf8");
      changedFiles += 1;
      touchedLines += Math.abs(after.split("\n").length - before.split("\n").length);
    }
  }

  // eslint-disable-next-line no-console
  console.log(`Tokenized CSS in ${changedFiles} files.`);
  // eslint-disable-next-line no-console
  console.log(`Done.`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

