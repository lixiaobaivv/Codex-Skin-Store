import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const CATALOG_DIR = join(ROOT, "catalog", "themes");
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const SHA256 = /^[a-f0-9]{64}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PACKAGE_ID = /^[a-z0-9]+(?:[.-][a-z0-9]+)+$/;
const RELEASE_URL = /^https:\/\/github\.com\/[^/]+\/[^/]+\/releases\/download\/[^/]+\/[^/?#]+\.dreamskin$/;
const CATEGORIES = new Set(["gradient", "nature", "minimal", "dark", "editorial"]);
const PLATFORMS = new Set(["macos", "windows"]);
const COLORS = new Set(["blue", "violet", "green", "teal", "rose", "orange", "neutral", "black"]);
const PATTERNS = new Set(["aurora", "grid", "paper", "horizon", "mist", "orb", "stars", "embers"]);

function fail(source, message) {
  throw new Error(`${source}: ${message}`);
}

function exactKeys(value, expected, source) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(source, "must be an object");
  const actual = Object.keys(value).sort();
  assert.deepEqual(actual, [...expected].sort(), `${source}: unknown or missing fields`);
}

function text(value, source, max = 80) {
  if (typeof value !== "string" || value.length < 1 || value.length > max || /[\u0000-\u001f\u007f-\u009f]/.test(value)) {
    fail(source, `must be safe text between 1 and ${max} characters`);
  }
}

function enumArray(value, allowed, source, max = Number.POSITIVE_INFINITY) {
  if (!Array.isArray(value) || value.length < 1 || value.length > max || new Set(value).size !== value.length) {
    fail(source, "must be a non-empty array without duplicates");
  }
  for (const item of value) if (!allowed.has(item)) fail(source, `contains unsupported value ${JSON.stringify(item)}`);
}

export function validateTheme(theme, source = "theme") {
  exactKeys(theme, ["slug", "name", "summary", "author", "category", "platforms", "colors", "tags", "stats", "featured", "isNew", "version", "engineRange", "publishedAt", "license", "package", "previewImage", "previewStyle"], source);
  if (typeof theme.slug !== "string" || !SLUG.test(theme.slug) || !PACKAGE_ID.test(theme.slug) || theme.slug.length > 80) fail(source, "invalid package-compatible slug");
  text(theme.name, `${source}.name`);
  text(theme.summary, `${source}.summary`, 180);
  if (!CATEGORIES.has(theme.category)) fail(source, "invalid category");
  enumArray(theme.platforms, PLATFORMS, `${source}.platforms`);
  enumArray(theme.colors, COLORS, `${source}.colors`);
  if (!Array.isArray(theme.tags) || theme.tags.length > 12 || new Set(theme.tags).size !== theme.tags.length) fail(source, "tags must be a unique array with at most 12 items");
  theme.tags.forEach((tag, index) => text(tag, `${source}.tags[${index}]`));
  if (![theme.featured, theme.isNew].every((value) => typeof value === "boolean")) fail(source, "featured and isNew must be booleans");
  if (!SEMVER.test(theme.version)) fail(source, "invalid theme version");
  if (typeof theme.engineRange !== "string" || !/^>=\d+\.\d+\.\d+ <\d+\.\d+\.\d+$/.test(theme.engineRange)) fail(source, "invalid engineRange");
  if (typeof theme.publishedAt !== "string" || !Number.isFinite(Date.parse(theme.publishedAt))) fail(source, "invalid publishedAt date");

  exactKeys(theme.author, ["name", "handle", "curated"], `${source}.author`);
  text(theme.author.name, `${source}.author.name`);
  if (typeof theme.author.handle !== "string" || !/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38}[A-Za-z0-9])?$/.test(theme.author.handle)) fail(source, "invalid author handle");
  if (typeof theme.author.curated !== "boolean") fail(source, "author.curated must be boolean");

  exactKeys(theme.stats, ["downloads", "rating", "reviews"], `${source}.stats`);
  if (!Number.isInteger(theme.stats.downloads) || theme.stats.downloads < 0) fail(source, "downloads must be a non-negative integer");
  if (typeof theme.stats.rating !== "number" || theme.stats.rating < 0 || theme.stats.rating > 5) fail(source, "rating must be between 0 and 5");
  if (!Number.isInteger(theme.stats.reviews) || theme.stats.reviews < 0) fail(source, "reviews must be a non-negative integer");

  exactKeys(theme.license, ["name", "spdx", "source"], `${source}.license`);
  if (theme.license.name !== "Codex-Skin Theme Assets" || theme.license.spdx !== "LicenseRef-Codex-Skin-Theme" || !["project-curated-assets", "creator-submitted-assets"].includes(theme.license.source)) fail(source, "unsupported license declaration");

  if (typeof theme.previewImage !== "string" || !/^\/theme-previews\/[a-z0-9-]+\.png$/.test(theme.previewImage)) fail(source, "invalid previewImage path");

  exactKeys(theme.previewStyle, ["backgroundColor", "backgroundImage", "panelColor", "panelBorder", "textColor", "mutedTextColor", "accentColor", "accentSoft", "codeColor", "shadow", "pattern"], `${source}.previewStyle`);
  for (const [key, value] of Object.entries(theme.previewStyle)) {
    if (key === "pattern") continue;
    if (typeof value !== "string" || value.length < 1 || value.length > 512 || /url\s*\(/i.test(value)) fail(source, `unsafe previewStyle.${key}`);
  }
  if (!PATTERNS.has(theme.previewStyle.pattern)) fail(source, "invalid preview pattern");

  if (theme.package !== null) {
    exactKeys(theme.package, ["published", "id", "version", "url", "sha256", "size"], `${source}.package`);
    if (theme.package.published !== true) fail(source, "package objects must be published; use null for preview-only themes");
    if (typeof theme.package.id !== "string" || !PACKAGE_ID.test(theme.package.id) || theme.package.id.length > 128) fail(source, "invalid package id");
    if (!SEMVER.test(theme.package.version) || theme.package.version !== theme.version) fail(source, "package version must be valid and match theme.version");
    if (typeof theme.package.url !== "string" || !RELEASE_URL.test(theme.package.url)) fail(source, "package URL must be an immutable GitHub Release HTTPS .dreamskin URL");
    if (typeof theme.package.sha256 !== "string" || !SHA256.test(theme.package.sha256) || /^0{64}$/.test(theme.package.sha256)) fail(source, "package sha256 must be a real lowercase digest");
    if (!Number.isInteger(theme.package.size) || theme.package.size < 1 || theme.package.size > 28 * 1024 * 1024) fail(source, "package size must be 1-29360128 bytes");
  }
  return theme;
}

export function validateCatalog(themes) {
  const slugs = new Set();
  const packages = new Set();
  for (const [index, theme] of themes.entries()) {
    validateTheme(theme, `theme[${index}]`);
    if (slugs.has(theme.slug)) fail("catalog", `duplicate slug ${theme.slug}`);
    slugs.add(theme.slug);
    if (theme.package) {
      const key = `${theme.package.id}@${theme.package.version}`;
      if (packages.has(key)) fail("catalog", `duplicate package ${key}`);
      packages.add(key);
    }
  }
  return themes;
}

export async function loadCatalog(directory = CATALOG_DIR) {
  const files = (await readdir(directory)).filter((name) => name.endsWith(".json")).sort();
  if (files.length === 0) fail("catalog", "no theme entries found");
  const themes = [];
  for (const file of files) {
    const theme = JSON.parse(await readFile(join(directory, file), "utf8"));
    if (`${theme.slug}.json` !== basename(file)) fail(file, "filename must match slug");
    themes.push(theme);
  }
  return validateCatalog(themes);
}

async function main() {
  const themes = await loadCatalog();
  const published = themes.filter((theme) => theme.package).length;
  console.log(`Validated ${themes.length} catalog entries (${published} published, ${themes.length - published} preview-only).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
