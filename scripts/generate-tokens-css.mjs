import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const materialDir = path.join(repoRoot, "styles", "tokens", "material");
const outDir = path.join(repoRoot, "styles", "tokens", "generated");
const outFile = path.join(outDir, "tokens.css");
const outStaticFile = path.join(outDir, "static.css");
const materialTypographyFile = path.join(outDir, "material-typography.css");
const themeFile = path.join(materialDir, "theme.json");
const typographyFile = path.join(materialDir, "typography.json");

/** Compact / Medium / Expanded — matches existing `styles/base.css` breakpoints. */
const BP_TABLET = "768px";
const BP_DESKTOP = "1025px";

/**
 * Branding sheet: semantic role → material-theme path per breakpoint
 * (mobile, tablet, desktop). Paths are token path segments (merged JSON keys).
 */
const MATERIAL_SEMANTIC_RULES = [
  {
    selectors: "h1",
    mobile: ["material-theme", "display", "small"],
    tablet: ["material-theme", "display", "medium"],
    desktop: ["material-theme", "display", "large"],
  },
  {
    selectors: "h2",
    mobile: ["material-theme", "headline", "small"],
    tablet: ["material-theme", "headline", "medium"],
    desktop: ["material-theme", "headline", "large"],
  },
  {
    selectors: "h3",
    mobile: ["material-theme", "title", "small"],
    tablet: ["material-theme", "title", "medium"],
    desktop: ["material-theme", "title", "large"],
  },
  {
    selectors: "body",
    mobile: ["material-theme", "body", "medium"],
    tablet: ["material-theme", "body", "medium"],
    desktop: ["material-theme", "body", "large"],
  },
  {
    /* Body copy only where it belongs — avoids cards/labels that misuse <p>. */
    selectors: "main p, article p, .md-prose p",
    mobile: ["material-theme", "body", "medium"],
    tablet: ["material-theme", "body", "medium"],
    desktop: ["material-theme", "body", "large"],
  },
  {
    selectors: "blockquote",
    mobile: ["material-theme", "headline", "small"],
    tablet: ["material-theme", "headline", "small"],
    desktop: ["material-theme", "headline", "medium"],
  },
  {
    /* Opt-in label styles (e.g. primary CTAs). Icon-only <button>s stay untouched. */
    selectors: ".md-type-label",
    mobile: ["material-theme", "label", "medium"],
    tablet: ["material-theme", "label", "large"],
    desktop: ["material-theme", "label", "large"],
  },
  {
    selectors: "small, .md-type-caption",
    mobile: ["material-theme", "label", "small"],
    tablet: ["material-theme", "label", "small"],
    desktop: ["material-theme", "label", "medium"],
  },
  {
    selectors: ".md-type-subtitle",
    mobile: ["material-theme", "body", "medium"],
    tablet: ["material-theme", "title", "small"],
    desktop: ["material-theme", "title", "medium"],
  },
];

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeVarName(parts) {
  return (
    "--" +
    parts
      .join("-")
      .replace(/\s+/g, "-")
      .replace(/\//g, "-")
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .replace(/-+/g, "-")
      .toLowerCase()
  );
}

async function readJsonFile(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

function stemFromPathParts(parts) {
  return normalizeVarName(parts);
}

function declarationBlockForStem(stemPrefix) {
  return [
    `  font-family: var(${stemPrefix}-font-family);`,
    `  font-weight: var(${stemPrefix}-font-weight);`,
    `  font-size: var(${stemPrefix}-font-size);`,
    `  line-height: var(${stemPrefix}-line-height);`,
    `  letter-spacing: var(${stemPrefix}-letter-spacing);`,
    `  text-transform: var(${stemPrefix}-text-transform);`,
    `  text-decoration: var(${stemPrefix}-text-decoration);`,
  ].join("\n");
}

function buildMaterialTypographyCss() {
  const lines = [];
  lines.push("/* AUTO-GENERATED. Maps semantic HTML / helpers to Material 3 roles (branding sheet). */");
  lines.push("/* Source: scripts/generate-tokens-css.mjs */");
  lines.push("");

  for (const rule of MATERIAL_SEMANTIC_RULES) {
    const sm = stemFromPathParts(rule.mobile);
    const md = stemFromPathParts(rule.tablet);
    const lg = stemFromPathParts(rule.desktop);

    lines.push(`${rule.selectors} {`);
    lines.push(declarationBlockForStem(sm));
    lines.push("}");
    lines.push("");
    lines.push(`@media (min-width: ${BP_TABLET}) {`);
    lines.push(`  ${rule.selectors} {`);
    lines.push(declarationBlockForStem(md).replace(/^/gm, "  "));
    lines.push("  }");
    lines.push("}");
    lines.push("");
    lines.push(`@media (min-width: ${BP_DESKTOP}) {`);
    lines.push(`  ${rule.selectors} {`);
    lines.push(declarationBlockForStem(lg).replace(/^/gm, "  "));
    lines.push("  }");
    lines.push("}");
    lines.push("");
  }

  return lines.join("\n");
}

function formatFontFamilyCss(name) {
  const n = String(name).trim();
  if (!n) return "system-ui, sans-serif";
  const quoted = /\s/.test(n) ? `"${n.replace(/"/g, '\\"')}"` : n;
  return `${quoted}, system-ui, sans-serif`;
}

function cssPx(n) {
  if (typeof n !== "number" || Number.isNaN(n)) throw new Error(`Expected number, got ${String(n)}`);
  if (n === 0) return "0";
  return `${n}px`;
}

function cssEmFromTracking(tracking) {
  if (typeof tracking !== "number" || Number.isNaN(tracking)) throw new Error(`Expected number, got ${String(tracking)}`);
  if (tracking === 0) return "0";
  // Material exports letterSpacing in px sometimes; our typography.json uses numeric px intent.
  return `${tracking}px`;
}

const STEP_TO_TONE = new Map([
  [50, 98],
  [100, 95],
  [200, 90],
  [300, 80],
  [400, 70],
  [500, 60],
  [600, 50],
  [700, 40],
  [800, 30],
  [900, 20],
]);

function paletteHex(palettes, key, tone) {
  const pal = palettes?.[key];
  const value = pal?.[String(tone)];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing palette ${key}.${tone}`);
  }
  return value.trim();
}

function schemeHex(schemes, mode, key) {
  const value = schemes?.[mode]?.[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing scheme ${mode}.${key}`);
  }
  return value.trim();
}

function pushVar(lines, name, value) {
  lines.push(`  --${name}: ${value};`);
}

function pushScale(lines, baseName, palettes, paletteKey) {
  for (const step of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]) {
    const tone = STEP_TO_TONE.get(step);
    const hex = paletteHex(palettes, paletteKey, tone);
    pushVar(lines, `${baseName}-${step}`, hex);
  }
}

function pushAllCoreColors(lines, coreColors) {
  for (const [k, v] of Object.entries(coreColors ?? {})) {
    if (typeof v !== "string" || !v.trim()) continue;
    pushVar(lines, `m3-core-${k}`, v.trim());
  }
}

function pushAllMaterialPalettes(lines, palettes) {
  for (const [paletteKey, toneMap] of Object.entries(palettes ?? {})) {
    if (!isObject(toneMap)) continue;
    for (const [tone, value] of Object.entries(toneMap)) {
      if (typeof value !== "string" || !value.trim()) continue;
      pushVar(lines, `m3-palette-${paletteKey}-${tone}`, value.trim());
    }
  }
}

function pushAllMaterialSchemes(lines, schemes) {
  for (const [mode, roleMap] of Object.entries(schemes ?? {})) {
    if (!isObject(roleMap)) continue;
    for (const [role, value] of Object.entries(roleMap)) {
      if (typeof value !== "string" || !value.trim()) continue;
      pushVar(lines, `m3-scheme-${mode}-${role}`, value.trim());
    }
  }
}

function pushMaterialTypographyVars(lines, typography) {
  const famBrand = formatFontFamilyCss(typography?.fontFamilies?.brand ?? "Roboto");
  const famDisplay = formatFontFamilyCss(typography?.fontFamilies?.display ?? typography?.fontFamilies?.brand ?? "Roboto");

  // Base font families (kept compatible with existing usage)
  pushVar(lines, "fontfamilies-roboto", famBrand);
  pushVar(lines, "fontfamilies-google-sans", '"Google Sans", system-ui, sans-serif');

  // Material role tokens (match old var naming: --material-theme-display-small-font-size, etc.)
  const roles = typography?.roles ?? {};
  for (const [roleKey, sizes] of Object.entries(roles)) {
    if (!isObject(sizes)) continue;
    for (const [sizeKey, def] of Object.entries(sizes)) {
      if (!isObject(def)) continue;
      const stem = normalizeVarName(["material-theme", roleKey, sizeKey]);
      const base = stem.slice(2); // remove leading --
      const fontFamily = roleKey === "display" ? famDisplay : famBrand;
      pushVar(lines, `${base}-font-family`, fontFamily);
      pushVar(lines, `${base}-font-weight`, String(def.fontWeight ?? 400));
      pushVar(lines, `${base}-font-size`, cssPx(def.fontSize ?? 14));
      pushVar(lines, `${base}-line-height`, cssPx(def.lineHeight ?? 20));
      pushVar(lines, `${base}-letter-spacing`, cssEmFromTracking(def.letterSpacing ?? 0));
      pushVar(lines, `${base}-text-transform`, "none");
      pushVar(lines, `${base}-text-decoration`, "none");
    }
  }
}

function alphaVarName(baseVar, alpha) {
  const pct = Math.round(alpha * 100);
  return `alpha-${baseVar.replace(/^--/, "").replace(/_/g, "-")}-${String(pct).padStart(2, "0")}`;
}

function pushAlpha(lines, baseVarName, alpha) {
  const name = alphaVarName(baseVarName, alpha);
  // Keep the exact CSS function out of component CSS; components reference var(--alpha-...)
  pushVar(lines, name, `rgb(from var(${baseVarName}) r g b / ${alpha})`);
  return `--${name}`;
}

function pushShadow(lines, name, value) {
  pushVar(lines, `shadow-${name}`, value);
}

async function main() {
  const theme = await readJsonFile(themeFile);
  const typography = await readJsonFile(typographyFile);
  const palettes = theme?.palettes ?? {};
  const schemes = theme?.schemes ?? {};

  const materialRoot = [];
  const staticRoot = [];

  // Ensure every value in theme.json is present at runtime (as CSS variables).
  pushAllCoreColors(materialRoot, theme?.coreColors ?? {});
  pushAllMaterialPalettes(materialRoot, palettes);
  pushAllMaterialSchemes(materialRoot, schemes);

  // Core scales (kept compatible with existing CSS variable names)
  pushScale(materialRoot, "black", palettes, "primary");
  pushScale(materialRoot, "primary", palettes, "primary");
  pushScale(materialRoot, "green", palettes, "secondary");
  pushScale(materialRoot, "secondary", palettes, "secondary");
  pushScale(materialRoot, "accent", palettes, "tertiary");
  pushScale(materialRoot, "accent-green", palettes, "tertiary");
  pushScale(materialRoot, "neutral-1", palettes, "neutral");
  pushScale(materialRoot, "neutral-2", palettes, "neutral-variant");

  // Minimal status scales (3-step, since Material export doesn't include palettes for these)
  pushVar(materialRoot, "error-red-50", `var(--m3-scheme-light-errorContainer)`);
  pushVar(materialRoot, "error-red-100", `var(--m3-scheme-light-error)`);
  pushVar(materialRoot, "error-red-200", `var(--m3-scheme-light-onErrorContainer)`);

  // Approximate success/warning from available palettes (can be replaced by extendedColors later)
  pushVar(materialRoot, "success-green-50", paletteHex(palettes, "secondary", 98));
  pushVar(materialRoot, "success-green-100", paletteHex(palettes, "secondary", 80));
  pushVar(materialRoot, "success-green-200", paletteHex(palettes, "secondary", 60));

  pushVar(materialRoot, "warning-yellow-50", paletteHex(palettes, "tertiary", 98));
  pushVar(materialRoot, "warning-yellow-100", paletteHex(palettes, "tertiary", 80));
  pushVar(materialRoot, "warning-yellow-200", paletteHex(palettes, "tertiary", 60));

  // Typography vars (Material-driven, via our typography.json)
  pushMaterialTypographyVars(materialRoot, typography);

  // Static (non-material) primitives/utilities used by CSS
  pushVar(staticRoot, "letterspacing-neg-03", "-0.03em");
  pushVar(staticRoot, "textcase-none", "none");
  pushVar(staticRoot, "textdecoration-none", "none");

  // Shape primitives (static)
  pushVar(staticRoot, "border-radius-none", "0px");
  pushVar(staticRoot, "border-radius-sm", "2px");
  pushVar(staticRoot, "border-radius-md", "4px");
  pushVar(staticRoot, "border-radius-lg", "8px");
  pushVar(staticRoot, "border-width-none", "0px");
  pushVar(staticRoot, "border-width-sm", "1px");
  pushVar(staticRoot, "border-width-md", "2px");
  pushVar(staticRoot, "border-width-lg", "4px");

  // Scale tokens (static)
  pushVar(staticRoot, "scale-0", "0px");
  pushVar(staticRoot, "scale-25", "1px");
  pushVar(staticRoot, "scale-50", "2px");
  pushVar(staticRoot, "scale-100", "4px");
  pushVar(staticRoot, "scale-200", "8px");
  pushVar(staticRoot, "scale-300", "12px");
  pushVar(staticRoot, "scale-400", "16px");
  pushVar(staticRoot, "scale-500", "20px");
  pushVar(staticRoot, "scale-600", "24px");
  pushVar(staticRoot, "scale-700", "28px");
  pushVar(staticRoot, "scale-800", "32px");
  pushVar(staticRoot, "scale-900", "36px");
  pushVar(staticRoot, "scale-1000", "40px");
  pushVar(staticRoot, "scale-1100", "48px");
  pushVar(staticRoot, "scale-1200", "64px");

  // Generic pixel tokens (static)
  for (let n = 0; n <= 1000; n += 1) {
    pushVar(staticRoot, `px-${n}`, `${n}px`);
  }
  pushVar(staticRoot, "px-9999", "9999px");

  // Semantic surfaces / text / borders (LIGHT defaults)
  pushVar(materialRoot, "surface-page", `var(--m3-scheme-light-background)`);
  pushVar(materialRoot, "surface-default", `var(--m3-scheme-light-surface)`);
  pushVar(materialRoot, "surface-action", `var(--m3-scheme-light-secondaryContainer)`);
  pushVar(materialRoot, "surface-action-hover", `var(--m3-scheme-light-secondaryFixed)`);
  pushVar(materialRoot, "surface-success", paletteHex(palettes, "secondary", 95));
  pushVar(materialRoot, "surface-warning", paletteHex(palettes, "tertiary", 95));
  pushVar(materialRoot, "surface-error", `var(--m3-scheme-light-errorContainer)`);
  pushVar(materialRoot, "surface-information", `var(--m3-scheme-light-tertiaryContainer)`);

  pushVar(materialRoot, "text-color-title", `var(--m3-scheme-light-onSurface)`);
  pushVar(materialRoot, "text-color-heading", `var(--m3-scheme-light-onSurface)`);
  pushVar(materialRoot, "text-color-subheading", `var(--m3-scheme-light-onSurface)`);
  pushVar(materialRoot, "text-color-body", `var(--m3-scheme-light-onSurfaceVariant)`);
  pushVar(materialRoot, "text-color-subtitle", `var(--m3-scheme-light-onSurfaceVariant)`);
  pushVar(materialRoot, "text-color-quote", `var(--m3-scheme-light-onSurfaceVariant)`);
  pushVar(materialRoot, "text-color-disabled", `var(--m3-scheme-light-outlineVariant)`);
  pushVar(materialRoot, "text-color-action", `var(--m3-scheme-light-onSecondaryContainer)`);
  pushVar(materialRoot, "text-color-action-hover", `var(--m3-scheme-light-onSecondaryContainer)`);
  pushVar(materialRoot, "text-color-on-action", `var(--m3-scheme-light-onSecondary)`);
  pushVar(materialRoot, "text-color-success", paletteHex(palettes, "secondary", 40));
  pushVar(materialRoot, "text-color-warning", paletteHex(palettes, "tertiary", 40));
  pushVar(materialRoot, "text-color-error", `var(--m3-scheme-light-error)`);
  pushVar(materialRoot, "text-color-information", `var(--m3-scheme-light-tertiary)`);

  pushVar(materialRoot, "border-default", `var(--m3-scheme-light-outlineVariant)`);
  pushVar(materialRoot, "border-disabled", `var(--m3-scheme-light-outlineVariant)`);
  pushVar(materialRoot, "border-action", `var(--m3-scheme-light-secondary)`);
  pushVar(materialRoot, "border-action-hover", `var(--m3-scheme-light-secondary)`);
  pushVar(materialRoot, "border-focus", `var(--m3-scheme-light-secondary)`);
  pushVar(materialRoot, "border-success", paletteHex(palettes, "secondary", 60));
  pushVar(materialRoot, "border-warning", paletteHex(palettes, "tertiary", 60));
  pushVar(materialRoot, "border-error", `var(--m3-scheme-light-error)`);
  pushVar(materialRoot, "border-information", `var(--m3-scheme-light-tertiary)`);

  // Icons mirror text colors for now (explicit vars used by styles)
  pushVar(materialRoot, "icons-default", `var(--m3-scheme-light-onSurface)`);
  pushVar(materialRoot, "icons-disabled", `var(--m3-scheme-light-outlineVariant)`);
  pushVar(materialRoot, "icons-action", `var(--m3-scheme-light-onSecondaryContainer)`);
  pushVar(materialRoot, "icons-action-hover", `var(--m3-scheme-light-onSecondaryContainer)`);
  pushVar(materialRoot, "icons-on-action", `var(--m3-scheme-light-onSecondary)`);
  pushVar(materialRoot, "icons-success", paletteHex(palettes, "secondary", 40));
  pushVar(materialRoot, "icons-warning", paletteHex(palettes, "tertiary", 40));
  pushVar(materialRoot, "icons-error", `var(--m3-scheme-light-error)`);
  pushVar(materialRoot, "icons-information", `var(--m3-scheme-light-tertiary)`);
  pushVar(materialRoot, "icons-quote", `var(--m3-scheme-light-onSurfaceVariant)`);

  // Alpha tokens (used across CSS for overlays, borders, shadows)
  // Base colors used for alpha derivations:
  // - --black-900, --neutral-2-50, --neutral-2-900, --secondary-400
  pushAlpha(staticRoot, "--black-900", 0);
  pushAlpha(staticRoot, "--black-900", 0.05);
  pushAlpha(staticRoot, "--black-900", 0.08);
  pushAlpha(staticRoot, "--black-900", 0.1);
  pushAlpha(staticRoot, "--black-900", 0.12);
  pushAlpha(staticRoot, "--black-900", 0.14);
  pushAlpha(staticRoot, "--black-900", 0.15);
  pushAlpha(staticRoot, "--black-900", 0.2);
  pushAlpha(staticRoot, "--black-900", 0.25);
  pushAlpha(staticRoot, "--black-900", 0.3);
  pushAlpha(staticRoot, "--black-900", 0.4);
  pushAlpha(staticRoot, "--black-900", 0.5);
  pushAlpha(staticRoot, "--black-900", 0.6);
  pushAlpha(staticRoot, "--black-900", 0.65);
  pushAlpha(staticRoot, "--black-900", 0.8);
  pushAlpha(staticRoot, "--black-900", 0.95);

  pushAlpha(staticRoot, "--neutral-2-50", 0.1);
  pushAlpha(staticRoot, "--neutral-2-50", 0.2);
  pushAlpha(staticRoot, "--neutral-2-50", 0.28);
  pushAlpha(staticRoot, "--neutral-2-50", 0.4);
  pushAlpha(staticRoot, "--neutral-2-50", 0.95);

  pushAlpha(staticRoot, "--neutral-2-900", 0.35);

  pushAlpha(staticRoot, "--secondary-400", 0.16);
  pushAlpha(staticRoot, "--secondary-400", 0.6);
  pushAlpha(staticRoot, "--secondary-400", 0.8);

  // Shadow recipe tokens (used widely; keep component CSS free of raw recipes)
  pushShadow(staticRoot, "none", "none");
  pushShadow(staticRoot, "sm-05", `0 1px 2px var(${normalizeVarName(["alpha-black-900-05"])})`);
  pushShadow(staticRoot, "sm-08", `0 1px 2px var(${normalizeVarName(["alpha-black-900-08"])})`);
  pushShadow(staticRoot, "sm-10", `0 1px 2px var(${normalizeVarName(["alpha-black-900-10"])})`);
  pushShadow(staticRoot, "sm-12", `0 1px 2px var(${normalizeVarName(["alpha-black-900-12"])})`);
  pushShadow(staticRoot, "md-08", `0 4px 12px var(${normalizeVarName(["alpha-black-900-08"])})`);
  pushShadow(staticRoot, "md-12", `0 4px 12px var(${normalizeVarName(["alpha-black-900-12"])})`);
  pushShadow(staticRoot, "lg-12", `0 6px 16px var(${normalizeVarName(["alpha-black-900-12"])})`);
  pushShadow(staticRoot, "xl-12", `0 10px 30px var(${normalizeVarName(["alpha-black-900-12"])})`);
  pushShadow(staticRoot, "popover-12", `0 12px 24px var(${normalizeVarName(["alpha-black-900-12"])})`);
  pushShadow(staticRoot, "drawer-20", `0 20px 40px var(${normalizeVarName(["alpha-black-900-20"])})`);
  pushShadow(staticRoot, "drawer-40", `0 20px 40px var(${normalizeVarName(["alpha-black-900-40"])})`);
  pushShadow(staticRoot, "overlay-25", `0 20px 50px var(${normalizeVarName(["alpha-black-900-25"])})`);
  pushShadow(staticRoot, "focus-neutral", `0 0 0 2px var(${normalizeVarName(["alpha-neutral-2-900-35"])})`);
  pushShadow(staticRoot, "focus-secondary", `0 0 0 2px var(${normalizeVarName(["alpha-secondary-400-16"])})`);

  // Dark mode overrides (opt-in via OS; you can later switch this to a data-attribute)
  const dark = [];
  pushVar(dark, "surface-page", `var(--m3-scheme-dark-background)`);
  pushVar(dark, "surface-default", `var(--m3-scheme-dark-surface)`);
  pushVar(dark, "surface-action", `var(--m3-scheme-dark-secondaryContainer)`);
  pushVar(dark, "surface-action-hover", `var(--m3-scheme-dark-secondaryFixed)`);
  pushVar(dark, "surface-success", paletteHex(palettes, "secondary", 20));
  pushVar(dark, "surface-warning", paletteHex(palettes, "tertiary", 20));
  pushVar(dark, "surface-error", `var(--m3-scheme-dark-errorContainer)`);
  pushVar(dark, "surface-information", `var(--m3-scheme-dark-tertiaryContainer)`);

  pushVar(dark, "text-color-title", `var(--m3-scheme-dark-onSurface)`);
  pushVar(dark, "text-color-heading", `var(--m3-scheme-dark-onSurface)`);
  pushVar(dark, "text-color-subheading", `var(--m3-scheme-dark-onSurface)`);
  pushVar(dark, "text-color-body", `var(--m3-scheme-dark-onSurfaceVariant)`);
  pushVar(dark, "text-color-subtitle", `var(--m3-scheme-dark-onSurfaceVariant)`);
  pushVar(dark, "text-color-quote", `var(--m3-scheme-dark-onSurfaceVariant)`);
  pushVar(dark, "text-color-disabled", `var(--m3-scheme-dark-outlineVariant)`);
  pushVar(dark, "text-color-action", `var(--m3-scheme-dark-onSecondaryContainer)`);
  pushVar(dark, "text-color-action-hover", `var(--m3-scheme-dark-onSecondaryContainer)`);
  pushVar(dark, "text-color-on-action", `var(--m3-scheme-dark-onSecondary)`);
  pushVar(dark, "text-color-success", paletteHex(palettes, "secondary", 80));
  pushVar(dark, "text-color-warning", paletteHex(palettes, "tertiary", 80));
  pushVar(dark, "text-color-error", `var(--m3-scheme-dark-error)`);
  pushVar(dark, "text-color-information", `var(--m3-scheme-dark-tertiary)`);

  pushVar(dark, "border-default", `var(--m3-scheme-dark-outlineVariant)`);
  pushVar(dark, "border-disabled", `var(--m3-scheme-dark-outlineVariant)`);
  pushVar(dark, "border-action", `var(--m3-scheme-dark-secondary)`);
  pushVar(dark, "border-action-hover", `var(--m3-scheme-dark-secondary)`);
  pushVar(dark, "border-focus", `var(--m3-scheme-dark-secondary)`);
  pushVar(dark, "border-success", paletteHex(palettes, "secondary", 70));
  pushVar(dark, "border-warning", paletteHex(palettes, "tertiary", 70));
  pushVar(dark, "border-error", `var(--m3-scheme-dark-error)`);
  pushVar(dark, "border-information", `var(--m3-scheme-dark-tertiary)`);

  pushVar(dark, "icons-default", `var(--m3-scheme-dark-onSurface)`);
  pushVar(dark, "icons-disabled", `var(--m3-scheme-dark-outlineVariant)`);
  pushVar(dark, "icons-action", `var(--m3-scheme-dark-onSecondaryContainer)`);
  pushVar(dark, "icons-action-hover", `var(--m3-scheme-dark-onSecondaryContainer)`);
  pushVar(dark, "icons-on-action", `var(--m3-scheme-dark-onSecondary)`);
  pushVar(dark, "icons-success", paletteHex(palettes, "secondary", 80));
  pushVar(dark, "icons-warning", paletteHex(palettes, "tertiary", 80));
  pushVar(dark, "icons-error", `var(--m3-scheme-dark-error)`);
  pushVar(dark, "icons-information", `var(--m3-scheme-dark-tertiary)`);
  pushVar(dark, "icons-quote", `var(--m3-scheme-dark-onSurfaceVariant)`);

  const materialCss = buildMaterialTypographyCss();

  await fs.mkdir(outDir, { recursive: true });
  const materialLines = [];
  materialLines.push("/* AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY. */");
  materialLines.push("/* Material-derived tokens only */");
  materialLines.push("/* Source: styles/tokens/material/theme.json + styles/tokens/material/typography.json */");
  materialLines.push("");
  materialLines.push(":root {");
  materialLines.push(...materialRoot.sort());
  materialLines.push("}");
  materialLines.push("");

  // `lines` currently contains only the dark override block. Rebuild it cleanly.
  const darkLines = [];
  darkLines.push("@media (prefers-color-scheme: dark) {");
  darkLines.push("  :root {");
  darkLines.push(...dark.sort().map((l) => `  ${l}`));
  darkLines.push("  }");
  darkLines.push("}");
  darkLines.push("");
  materialLines.push(...darkLines);

  const staticLines = [];
  staticLines.push("/* AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY. */");
  staticLines.push("/* Static helper tokens (NOT from material-theme.json) */");
  staticLines.push("/* Source: scripts/generate-tokens-css.mjs */");
  staticLines.push("");
  staticLines.push(":root {");
  staticLines.push(...staticRoot.sort());
  staticLines.push("}");
  staticLines.push("");

  await fs.writeFile(outFile, materialLines.join("\n"), "utf8");
  await fs.writeFile(outStaticFile, staticLines.join("\n"), "utf8");
  await fs.writeFile(materialTypographyFile, materialCss, "utf8");

  // eslint-disable-next-line no-console
  console.log(
    `Wrote ${path.relative(repoRoot, outFile)}, ${path.relative(repoRoot, outStaticFile)} and ${path.relative(repoRoot, materialTypographyFile)}`
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
