import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("desktop feed is lightweight, complete, and content addressed", async () => {
  const feed = JSON.parse(await readFile(new URL("desktop-catalog-v2.json", root), "utf8"));
  const repository = JSON.parse(await readFile(new URL("theme-repository.json", root), "utf8"));
  assert.equal(feed.schemaVersion, 2);
  assert.equal(feed.revision, repository.updatedAt);
  assert.deepEqual(feed.themes.map(theme => theme.id), repository.themes.map(theme => theme.id));

  for (const theme of feed.themes) {
    assert.match(theme.version, /^\d+\.\d+\.\d+/);
    assert.ok(theme.assets.some(asset => asset.path === theme.preview.path));
    for (const resource of [theme.manifest, ...theme.assets]) {
      const bytes = await readFile(new URL(resource.path, root));
      assert.equal(resource.size, bytes.length);
      assert.equal(resource.sha256, createHash("sha256").update(bytes).digest("hex"));
      if (resource === theme.manifest) {
        const manifest = JSON.parse(bytes.toString("utf8"));
        assert.equal("backgroundFit" in manifest.theme, false, `${theme.id} must not use unsupported backgroundFit`);
      }
    }
  }
});
