import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const componentsDir = path.join(repoRoot, "styles", "components");
const tokensCssPath = path.join(repoRoot, "styles", "tokens", "generated", "tokens.css");

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
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

function collectCssVarsFromTokensCss(tokensCssText) {
  const vars = new Set();
  const re = /^\s*(--[a-zA-Z0-9_-]+)\s*:/gm;
  let m;
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(tokensCssText))) vars.add(m[1]);
  return vars;
}

function collectVarUsagesFromCss(cssText) {
  const vars = [];
  const re = /var\(\s*(--[a-zA-Z0-9_-]+)/g;
  let m;
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(cssText))) vars.push(m[1]);
  return vars;
}

function addUsage(map, varName, fileRel) {
  const prev = map.get(varName);
  if (!prev) map.set(varName, { count: 1, files: new Set([fileRel]) });
  else {
    prev.count += 1;
    prev.files.add(fileRel);
  }
}

function formatSection(title, entries) {
  const lines = [];
  lines.push("");
  lines.push(`## ${title} (${entries.length})`);
  for (const { varName, count, files } of entries) {
    const fileList = [...files].slice(0, 8);
    const more = files.size > fileList.length ? ` (+${files.size - fileList.length} more)` : "";
    lines.push(`- ${varName}  (uses: ${count}, files: ${fileList.join(", ")}${more})`);
  }
  return lines.join("\n");
}

async function main() {
  const tokensCssText = await fs.readFile(tokensCssPath, "utf8");
  const tokenVars = collectCssVarsFromTokensCss(tokensCssText);

  const files = (await listFilesRecursive(componentsDir)).filter((p) => p.endsWith(".css"));

  const usage = new Map();
  for (const file of files) {
    const rel = path.relative(repoRoot, file);
    const css = await fs.readFile(file, "utf8");
    for (const v of collectVarUsagesFromCss(css)) addUsage(usage, v, rel);
  }

  const missing = [];
  const underscoreHex = [];
  const ui = [];
  const otherNonToken = [];

  for (const [varName, meta] of usage.entries()) {
    if (tokenVars.has(varName)) continue;

    missing.push({ varName, ...meta });
    if (varName.startsWith("--_hex_") || varName.startsWith("--_rgb_") || varName.startsWith("--_hsl_")) {
      underscoreHex.push({ varName, ...meta });
    } else if (varName.startsWith("--ui-")) {
      ui.push({ varName, ...meta });
    } else {
      otherNonToken.push({ varName, ...meta });
    }
  }

  const byName = (a, b) => a.varName.localeCompare(b.varName);
  missing.sort(byName);
  underscoreHex.sort(byName);
  ui.sort(byName);
  otherNonToken.sort(byName);

  const lines = [];
  lines.push(`# Missing Tokens Report`);
  lines.push(`Scanned: ${path.relative(repoRoot, componentsDir)}/**/*.css`);
  lines.push(`Compared against: ${path.relative(repoRoot, tokensCssPath)}`);
  lines.push("");
  lines.push(`Token vars found: ${tokenVars.size}`);
  lines.push(`Component var() refs found: ${usage.size}`);
  lines.push(`Not in tokens.css: ${missing.length}`);

  lines.push(formatSection("LITERAL-WRAPPER vars (--_hex_ / --_rgb_ / --_hsl_)", underscoreHex));
  lines.push(formatSection("LEGACY shared palette vars (--ui-*)", ui));
  lines.push(formatSection("OTHER non-token vars", otherNonToken));

  process.stdout.write(lines.join("\n") + "\n");
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

