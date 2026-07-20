import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, "desktop-catalog-v2.json");
const check = process.argv.includes("--check");
const repository = JSON.parse(await readFile(join(root, "theme-repository.json"), "utf8"));
const themes = [];

for (const entry of repository.themes) {
  const manifestPath = normalizeRepositoryPath(entry.manifest);
  const manifestBytes = await readFile(join(root, manifestPath));
  const manifest = JSON.parse(manifestBytes);
  assert.equal(manifest.codeThemeId, entry.id, `${entry.id}: manifest ID mismatch`);

  const previewPath = resolveAsset(manifestPath, manifest.previewImage, "previews");
  const assetPaths = [
    previewPath,
    resolveAsset(manifestPath, manifest.theme?.backgroundImage, "backgrounds", true),
    resolveAsset(manifestPath, manifest.theme?.logoImage, "logos", true),
    resolveAsset(manifestPath, manifest.theme?.effects?.overlay?.image, "effects", true),
    resolveAsset(manifestPath, manifest.theme?.effects?.composerAccent?.image, "effects", true),
    resolveAsset(manifestPath, manifest.home?.pet?.image, "pets", true),
  ].filter(Boolean);
  const assets = [];
  for (const path of [...new Set(assetPaths)]) assets.push(await resource(path));

  themes.push({
    id: entry.id,
    version: manifest.version,
    name: manifest.displayName,
    description: manifest.description,
    category: manifest.category,
    variant: manifest.variant,
    manifest: await resource(manifestPath, manifestBytes),
    preview: assets.find(asset => asset.path === previewPath),
    assets,
  });
}

const feed = {
  schemaVersion: 2,
  name: repository.name,
  revision: repository.updatedAt,
  themes,
};
const serialized = `${JSON.stringify(feed, null, 2)}\n`;

if (check) {
  const existing = await readFile(output, "utf8").catch(() => "");
  assert.equal(existing, serialized, "desktop-catalog-v2.json is stale; run npm run catalog:generate");
  console.log(`Desktop feed is current: ${themes.length} themes.`);
} else {
  await writeFile(output, serialized);
  console.log(`Generated desktop-catalog-v2.json with ${themes.length} themes.`);
}

async function resource(path, bytes = undefined) {
  const content = bytes ?? await readFile(join(root, path));
  return {
    path,
    sha256: createHash("sha256").update(content).digest("hex"),
    size: content.length,
  };
}

function resolveAsset(manifestPath, value, directory, optional = false) {
  if (!value) {
    if (optional) return null;
    throw new Error(`${manifestPath}: required ${directory} asset is missing`);
  }
  const absolute = resolve(root, dirname(manifestPath), value);
  const allowed = resolve(root, directory);
  if (absolute === allowed || !absolute.startsWith(`${allowed}${sep}`)) {
    throw new Error(`${manifestPath}: asset escapes ${directory}`);
  }
  return normalizeRepositoryPath(relative(root, absolute));
}

function normalizeRepositoryPath(value) {
  const normalized = value.replaceAll("\\", "/");
  if (!normalized || normalized.startsWith("/") || normalized.includes("../")) {
    throw new Error(`Unsafe repository path: ${value}`);
  }
  return normalized;
}
