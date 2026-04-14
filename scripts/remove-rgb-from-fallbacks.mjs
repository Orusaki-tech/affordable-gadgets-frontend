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

async function main() {
  const files = (await listFilesRecursive(stylesDir)).filter((p) => p.endsWith(".css"));
  const skip = new Set([tokensCssPath]);

  const replacements = [
    ["rgb(from var(--black-900, #000000)", "rgb(from var(--black-900)"],
    ["rgb(from var(--neutral-2-50, #ffffff)", "rgb(from var(--neutral-2-50)"],
    ["rgb(from var(--secondary-400, #18f181)", "rgb(from var(--secondary-400)"],
    ["rgb(from var(--neutral-2-900, #1c1c1c)", "rgb(from var(--neutral-2-900)"],
  ];

  let changedFiles = 0;

  for (const file of files) {
    if (skip.has(file)) continue;
    const original = normalizeNewlines(await fs.readFile(file, "utf8"));
    let out = original;
    for (const [from, to] of replacements) out = out.split(from).join(to);
    if (out === original) continue;
    await fs.writeFile(file, out, "utf8");
    changedFiles += 1;
  }

  // eslint-disable-next-line no-console
  console.log(`Removed rgb(from var(--token, #fallback)) in ${changedFiles} files.`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

