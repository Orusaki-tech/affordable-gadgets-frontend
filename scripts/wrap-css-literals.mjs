import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const targetDir = path.join(repoRoot, "styles", "components");

function sanitizeVarName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function wrapHex(match) {
  const hex = match.slice(1).toLowerCase();
  const varName = `--_hex_${sanitizeVarName(hex)}`;
  return `var(${varName}, ${match})`;
}

function wrapFunc(match) {
  const normalized = sanitizeVarName(match);
  const varName = `--_fn_${normalized}`;
  return `var(${varName}, ${match})`;
}

function wrapLiterals(css) {
  let out = css;

  // Hex colors (#rgb, #rgba, #rrggbb, #rrggbbaa)
  out = out.replace(/#[0-9a-fA-F]{3,8}\b/g, (m) => wrapHex(m));

  // rgb()/rgba()/hsl()/hsla() functions
  out = out.replace(/\b(?:rgba?|hsla?)\(\s*[^)]+\)/g, (m) => wrapFunc(m));

  return out;
}

async function listCssFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const ent of entries) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      files.push(...(await listCssFiles(p)));
    } else if (ent.isFile() && ent.name.endsWith(".css")) {
      files.push(p);
    }
  }
  return files;
}

async function main() {
  const files = await listCssFiles(targetDir);
  let changed = 0;

  for (const file of files) {
    // Skip our wrapper base.css files (they should just @import).
    if (path.basename(file).toLowerCase() === "base.css") continue;

    const before = await fs.readFile(file, "utf8");
    const after = wrapLiterals(before);
    if (after !== before) {
      await fs.writeFile(file, after, "utf8");
      changed++;
    }
  }

  // eslint-disable-next-line no-console
  console.log(`Wrapped literals in ${changed}/${files.length} CSS files under ${path.relative(repoRoot, targetDir)}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

