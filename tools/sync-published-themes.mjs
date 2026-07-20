import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const catalogDir = join(root, "catalog", "themes");
const outputDir = process.env.CODEX_SKIN_PACKAGE_OUTPUT?.trim();
const requestedId = (process.argv[2] ?? "").trim();
const releaseRepository = process.env.CODEX_SKIN_RELEASE_REPOSITORY?.trim() || "lixiaobaivv/Codex-Skin";
const token = process.env.GH_TOKEN?.trim();

if (!outputDir) throw new Error("CODEX_SKIN_PACKAGE_OUTPUT is required.");
if (requestedId && !/^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(requestedId)) throw new Error("Invalid theme ID.");
if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(releaseRepository)) throw new Error("Invalid release repository.");

await mkdir(outputDir, { recursive: true });
const index = JSON.parse(await readFile(join(root, "theme-repository.json"), "utf8"));
const entries = index.themes ?? [];
if (requestedId && !entries.some(entry => entry.id === requestedId)) {
  throw new Error(`${requestedId} is not listed in theme-repository.json.`);
}

const published = [];
for (const entry of entries) {
  if (requestedId && entry.id !== requestedId) continue;
  const catalogPath = join(catalogDir, `${entry.id}.json`);
  const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
  if (catalog.package !== null) continue;

  const releaseTag = `theme-${entry.id}-v${catalog.version}`;
  const packageName = `Codex-Skin-theme-${entry.id}-${catalog.version}.dreamskin`;
  const release = await getRelease(releaseTag, Boolean(requestedId));
  if (!release) continue;
  if (release.draft || release.prerelease || release.tag_name !== releaseTag) {
    throw new Error(`${entry.id}: release must be final and match ${releaseTag}.`);
  }
  const asset = release.assets?.find(candidate => candidate.name === packageName);
  if (!asset?.browser_download_url) throw new Error(`${entry.id}: release is missing ${packageName}.`);

  const response = await fetch(asset.browser_download_url, { redirect: "follow" });
  if (!response.ok) throw new Error(`${entry.id}: package download returned HTTP ${response.status}.`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length !== asset.size || bytes.length < 1 || bytes.length > 28 * 1024 * 1024) {
    throw new Error(`${entry.id}: downloaded package size does not match the Release asset.`);
  }
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (asset.digest && asset.digest !== `sha256:${sha256}`) {
    throw new Error(`${entry.id}: downloaded package digest does not match GitHub metadata.`);
  }

  const packagePath = join(outputDir, basename(packageName));
  await writeFile(packagePath, bytes, { mode: 0o600 });
  catalog.package = {
    published: true,
    id: entry.id,
    version: catalog.version,
    url: asset.browser_download_url,
    sha256,
    size: bytes.length,
  };
  await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  published.push(entry.id);
}

process.stdout.write(JSON.stringify(published));

async function getRelease(tag, required) {
  const url = `https://api.github.com/repos/${releaseRepository}/releases/tags/${encodeURIComponent(tag)}`;
  let response = await fetchRelease(url, token);
  if (token && (response.status === 403 || response.status === 404)) response = await fetchRelease(url);
  if (response.status === 404 && !required) return null;
  if (!response.ok) throw new Error(`Release lookup for ${tag} returned HTTP ${response.status}.`);
  return response.json();
}

function fetchRelease(url, authorizationToken) {
  return fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "Codex-Skin-Store-Publisher",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(authorizationToken ? { Authorization: `Bearer ${authorizationToken}` } : {}),
    },
  });
}
