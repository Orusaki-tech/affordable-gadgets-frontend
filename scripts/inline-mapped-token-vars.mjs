import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const stylesDir = path.join(repoRoot, "styles");
const baseCssPath = path.join(stylesDir, "base.css");
const generatedTokensPath = path.join(stylesDir, "tokens", "generated", "tokens.css");

function normalizeNewlines(s) {
  return s.replace(/\r\n/g, "\n");
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractRootBlock(cssText) {
  // naive-but-safe: grab first :root { ... } block (your mappings live there)
  const start = cssText.indexOf(":root");
  if (start === -1) return "";
  const brace = cssText.indexOf("{", start);
  if (brace === -1) return "";
  let i = brace + 1;
  let depth = 1;
  while (i < cssText.length && depth > 0) {
    const ch = cssText[i];
    if (ch === "{") depth += 1;
    else if (ch === "}") depth -= 1;
    i += 1;
  }
  return cssText.slice(brace + 1, i - 1);
}

function parseVarToVarMappings(rootBlockText) {
  // Parse lines like:
  // --ui-gray-100: var(--surface-action, #f3f4f6);
  // --gray-50: var(--neutral-1-50, #f5f5f7);
  //
  // We only record mappings where the first argument of var() is another CSS variable.
  const mappings = new Map(); // legacyVar -> tokenVar
  const re = /--([a-zA-Z0-9_-]+)\s*:\s*var\(\s*(--[a-zA-Z0-9_-]+)\s*(?:,|\))/g;
  let m;
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(rootBlockText))) {
    mappings.set(`--${m[1]}`, m[2]);
  }
  return mappings;
}

function parseGeneratedTokenVars(tokensCssText) {
  const vars = new Set();
  const re = /^\s*(--[a-zA-Z0-9_-]+)\s*:/gm;
  let m;
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(tokensCssText))) vars.add(m[1]);
  return vars;
}

async function listCssFiles(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...(await listCssFiles(full)));
    else if (ent.isFile() && ent.name.endsWith(".css")) out.push(full);
  }
  return out;
}

function replaceVarCalls(cssText, mappings, tokenVars) {
  // Replace var(--legacy, ...) with var(--token, ...)
  // Replace var(--legacy) with var(--token)
  //
  // Only do so if legacyVar maps to tokenVar and tokenVar exists in generated tokens.
  let changed = false;
  let out = cssText;

  // Two-pass per mapping for simplicity and readability.
  for (const [legacyVar, tokenVar] of mappings.entries()) {
    if (!tokenVars.has(tokenVar)) continue;

    // var(--legacyVar , ...) or var(--legacyVar,...)
    const reWithFallback = new RegExp(`var\\(\\s*${escapeRegExp(legacyVar)}\\s*,`, "g");
    out = out.replace(reWithFallback, () => {
      changed = true;
      return `var(${tokenVar},`;
    });

    // var(--legacyVar) with optional whitespace
    const reNoFallback = new RegExp(`var\\(\\s*${escapeRegExp(legacyVar)}\\s*\\)`, "g");
    out = out.replace(reNoFallback, () => {
      changed = true;
      return `var(${tokenVar})`;
    });
  }

  return { out, changed };
}

async function main() {
  const baseCss = normalizeNewlines(await fs.readFile(baseCssPath, "utf8"));
  const rootBlock = extractRootBlock(baseCss);
  const mappings = parseVarToVarMappings(rootBlock);

  const generatedTokens = normalizeNewlines(await fs.readFile(generatedTokensPath, "utf8"));
  const tokenVars = parseGeneratedTokenVars(generatedTokens);

  const cssFiles = await listCssFiles(stylesDir);
  const skip = new Set([baseCssPath, generatedTokensPath]);

  let changedFiles = 0;
  let changedReplacements = 0;

  for (const file of cssFiles) {
    if (skip.has(file)) continue;
    const original = normalizeNewlines(await fs.readFile(file, "utf8"));
    const { out, changed } = replaceVarCalls(original, mappings, tokenVars);
    if (!changed) continue;
    await fs.writeFile(file, out, "utf8");
    changedFiles += 1;

    // heuristic count: how many legacy vars still exist vs not is expensive; do quick diff count
    for (const [legacyVar] of mappings.entries()) {
      if (original.includes(legacyVar) && !out.includes(legacyVar)) changedReplacements += 1;
    }
  }

  // eslint-disable-next-line no-console
  console.log(
    `Updated ${changedFiles} CSS files. (Removed at least ${changedReplacements} mapped variable names.)`
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

