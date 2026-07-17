import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const index = await readJson("theme-repository.json");
exactKeys(index, ["$schema", "schemaVersion", "name", "updatedAt", "themes"], "theme-repository.json");
assert.equal(index.schemaVersion, 1, "desktop catalog schemaVersion must be 1");
assert.match(index.updatedAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/, "updatedAt must be UTC");
assert.ok(Array.isArray(index.themes) && index.themes.length > 0 && index.themes.length <= 500, "themes must contain 1-500 entries");

await Promise.all([
  stat(join(root, "schemas", "theme-repository-v1.schema.json")),
  stat(join(root, "schemas", "theme-v1.schema.json")),
]);

const indexed = new Set();
for (const entry of index.themes) {
  exactKeys(entry, ["id", "manifest"], `catalog entry ${entry?.id ?? "unknown"}`);
  assert.match(entry.id, /^[a-z0-9][a-z0-9-]{1,63}$/, `invalid theme id: ${entry.id}`);
  assert.equal(entry.manifest, `themes/${entry.id}.json`, `manifest must match theme id: ${entry.id}`);
  assert.ok(!indexed.has(entry.id), `duplicate theme id: ${entry.id}`);
  indexed.add(entry.id);

  const theme = await readJson(entry.manifest);
  assert.equal(theme.schemaVersion, 1, `${entry.id}: schemaVersion must be 1`);
  assert.equal(theme.codeThemeId, entry.id, `${entry.id}: codeThemeId mismatch`);
  const assets = [
    [theme.previewImage, "previews"],
    [theme.theme?.backgroundImage, "backgrounds"],
    [theme.theme?.logoImage, "logos"],
    [theme.home?.pet?.image, "pets"],
  ];
  for (const [asset, directory] of assets) {
    if (!asset) continue;
    assert.match(asset, new RegExp(`^\\.\\./${directory}/[A-Za-z0-9._-]+\\.(?:png|jpe?g|webp|avif)$`), `${entry.id}: unsafe ${directory} path`);
    await validateImage(join(root, "themes", asset), entry.id, directory);
  }
}

const actual = new Set((await readdir(join(root, "themes"), { withFileTypes: true }))
  .filter(entry => entry.isFile() && entry.name.endsWith(".json"))
  .map(entry => entry.name.slice(0, -5)));
assert.deepEqual([...actual].sort(), [...indexed].sort(), "theme index must exactly match themes directory");
console.log(`Desktop catalog valid: ${indexed.size} themes.`);

async function readJson(path) {
  return JSON.parse(await readFile(join(root, path), "utf8"));
}

function exactKeys(value, expected, label) {
  assert.ok(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assert.deepEqual(Object.keys(value).sort(), [...expected].sort(), `${label} contains missing or unknown fields`);
}

async function validateImage(path, themeId, role) {
  const absolute = resolve(path);
  assert.ok(absolute.startsWith(`${root}${sep}`), `${themeId}: asset escapes repository`);
  const bytes = await readFile(absolute);
  const extension = extname(absolute).toLowerCase();
  const valid = extension === ".png"
    ? bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))
    : extension === ".jpg" || extension === ".jpeg"
      ? bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      : extension === ".webp"
        ? bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP"
        : extension === ".avif"
          ? bytes.subarray(4, 8).toString() === "ftyp" && ["avif", "avis"].some(brand => bytes.includes(Buffer.from(brand)))
          : false;
  assert.ok(valid, `${themeId}: image signature does not match ${relative(root, absolute)}`);
  const limits = role === "previews"
    ? { bytes: 2 * 1024 * 1024, dimension: 2400 }
    : role === "backgrounds"
      ? { bytes: 16 * 1024 * 1024, dimension: 8192 }
      : { bytes: 20 * 1024 * 1024, dimension: 8192 };
  assert.ok(bytes.length <= limits.bytes, `${themeId}: ${role} image exceeds ${limits.bytes} bytes`);
  const dimensions = imageDimensions(bytes, extension);
  assert.ok(dimensions.width <= limits.dimension && dimensions.height <= limits.dimension,
    `${themeId}: ${role} image exceeds ${limits.dimension}x${limits.dimension} pixels`);
}

function imageDimensions(bytes, extension) {
  if (extension === ".png") return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  if (extension === ".jpg" || extension === ".jpeg") {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) { offset += 1; continue; }
      const marker = bytes[offset + 1];
      const length = bytes.readUInt16BE(offset + 2);
      if (length < 2 || offset + 2 + length > bytes.length) break;
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return { height: bytes.readUInt16BE(offset + 5), width: bytes.readUInt16BE(offset + 7) };
      }
      offset += 2 + length;
    }
  }
  if (extension === ".webp") {
    const kind = bytes.subarray(12, 16).toString();
    if (kind === "VP8X") return { width: 1 + bytes.readUIntLE(24, 3), height: 1 + bytes.readUIntLE(27, 3) };
    if (kind === "VP8 ") return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff };
    if (kind === "VP8L") return { width: 1 + bytes[21] + ((bytes[22] & 0x3f) << 8), height: 1 + (bytes[22] >> 6) + (bytes[23] << 2) + ((bytes[24] & 0x0f) << 10) };
  }
  if (extension === ".avif") {
    const marker = bytes.indexOf(Buffer.from("ispe"));
    if (marker >= 4 && marker + 16 <= bytes.length) return { width: bytes.readUInt32BE(marker + 8), height: bytes.readUInt32BE(marker + 12) };
  }
  assert.fail(`cannot read image dimensions for ${extension}`);
}
