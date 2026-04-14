import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const stylesDir = path.join(repoRoot, "styles");
const baseCssPath = path.join(stylesDir, "base.css");
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

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function collectCssVarsDeclared(cssText) {
  const vars = new Set();
  const re = /^\s*(--[a-zA-Z0-9_-]+)\s*:/gm;
  let m;
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(cssText))) vars.add(m[1]);
  return vars;
}

function extractFirstRootBlock(cssText) {
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

function parseUiVarDefinitions(rootBlockText) {
  // Parse `--ui-foo: <value>;` definitions (single-line values)
  // This repo's base.css uses one-line definitions for ui vars.
  const map = new Map(); // --ui-foo -> "<value>"
  const re = /^\s*(--ui-[a-zA-Z0-9_-]+)\s*:\s*([^;]+);\s*$/gm;
  let m;
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(rootBlockText))) {
    map.set(m[1], m[2].trim());
  }
  return map;
}

function inlineUiVarCalls(cssText, uiDefs, tokenVars) {
  let out = cssText;
  let changed = false;

  for (const [uiVar, value] of uiDefs.entries()) {
    // Only inline if the definition ultimately references token vars.
    // Heuristic: it must contain at least one `var(--` and any referenced var should be a token var OR another ui var we also inline.
    if (!value.includes("var(--")) continue;

    // Protect against accidentally inlining references to non-token vars we don't want.
    // We'll allow token vars and ui vars only.
    const referenced = [];
    const reRefs = /var\(\s*(--[a-zA-Z0-9_-]+)/g;
    let rm;
    // eslint-disable-next-line no-cond-assign
    while ((rm = reRefs.exec(value))) referenced.push(rm[1]);
    const ok = referenced.every((v) => tokenVars.has(v) || v.startsWith("--ui-"));
    if (!ok) continue;

    const replacement = `(${value})`;

    // var(--ui-foo, <fallback>)
    const reWithFallback = new RegExp(`var\\(\\s*${escapeRegExp(uiVar)}\\s*,[^\\)]*\\)`, "g");
    out = out.replace(reWithFallback, () => {
      changed = true;
      return replacement;
    });

    // var(--ui-foo)
    const reNoFallback = new RegExp(`var\\(\\s*${escapeRegExp(uiVar)}\\s*\\)`, "g");
    out = out.replace(reNoFallback, () => {
      changed = true;
      return replacement;
    });
  }

  return { out, changed };
}

async function main() {
  const baseCss = normalizeNewlines(await fs.readFile(baseCssPath, "utf8"));
  const rootBlock = extractFirstRootBlock(baseCss);
  const uiDefs = parseUiVarDefinitions(rootBlock);

  const tokensCss = normalizeNewlines(await fs.readFile(tokensCssPath, "utf8"));
  const tokenVars = collectCssVarsDeclared(tokensCss);

  const files = (await listFilesRecursive(stylesDir)).filter((p) => p.endsWith(".css"));
  const skip = new Set([baseCssPath, tokensCssPath]);

  let changedFiles = 0;

  for (const file of files) {
    if (skip.has(file)) continue;
    const original = normalizeNewlines(await fs.readFile(file, "utf8"));
    const { out, changed } = inlineUiVarCalls(original, uiDefs, tokenVars);
    if (!changed) continue;
    await fs.writeFile(file, out, "utf8");
    changedFiles += 1;
  }

  // eslint-disable-next-line no-console
  console.log(`Inlined token-based --ui-* vars in ${changedFiles} CSS files.`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

