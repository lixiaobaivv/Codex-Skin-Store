import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateCatalog, validateTheme } from "../tools/validate-catalog.mjs";

const schemaUrl = new URL("../spec/theme-package.schema.json", import.meta.url);

test("theme package schema stays declarative and closed", async () => {
  const schema = JSON.parse(await readFile(schemaUrl, "utf8"));

  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.equal(schema.additionalProperties, false);
  assert.ok(schema.required.includes("signature"));
  assert.ok(schema.required.includes("assets"));

  const source = JSON.stringify(schema);
  assert.doesNotMatch(source, /javascript|text\/css|image\/svg\+xml/i);
  assert.match(source, /image\/png/);
  assert.match(source, /image\/webp/);
  assert.match(source, /Ed25519/);
});

test("storefront catalogs and enables the published signed sample", async () => {
  const [storefront, catalogEntry, generated, links] = await Promise.all([
    readFile(new URL("../components/storefront.tsx", import.meta.url), "utf8"),
    readFile(new URL("../catalog/themes/jackson-sage-signed-sample.json", import.meta.url), "utf8"),
    readFile(new URL("../lib/generated-themes.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/dreamskin-link.ts", import.meta.url), "utf8"),
  ]);

  assert.match(storefront, /一键导入/);
  assert.match(storefront, /手动下载/);
  assert.doesNotMatch(storefront, /PROTOCOL_PREVIEW_SHA256|dreamskin\.store\/packages/);
  assert.match(catalogEntry, /releases\/download\/sample-v1\/codex-skin-sample-1\.0\.0\.dreamskin/);
  assert.match(catalogEntry, /7a75fff8086fe6949ef9e37e82c161a8e015a1e00e02181938cd479e9ae41387/);
  assert.match(catalogEntry, /"size": 2041227/);
  assert.match(catalogEntry, /"published": true/);
  assert.match(generated, /jackson-sage-signed-sample/);
  assert.match(storefront, /theme\.package\?\.published/);
  assert.match(links, /URLSearchParams/);
  assert.match(links, /dreamskin:\/\/install/);
});

test("store catalog schema is closed and requires complete package metadata", async () => {
  const schema = JSON.parse(await readFile(new URL("../spec/store-theme.schema.json", import.meta.url), "utf8"));
  assert.equal(schema.additionalProperties, false);
  assert.ok(schema.required.includes("package"));
  assert.equal(schema.properties.package.oneOf[0].type, "null");
  assert.deepEqual(
    schema.properties.package.oneOf[1].required,
    ["published", "id", "version", "url", "sha256", "size"],
  );
  assert.equal(schema.properties.package.oneOf[1].properties.published.const, true);
});

test("catalog validation rejects placeholders, unknown fields, and duplicates", async () => {
  const sample = JSON.parse(await readFile(new URL("../catalog/themes/jackson-sage-signed-sample.json", import.meta.url), "utf8"));

  assert.throws(
    () => validateTheme({ ...sample, unexpected: true }, "bad-theme"),
    /unknown or missing fields/,
  );
  assert.throws(
    () => validateTheme({ ...sample, package: { ...sample.package, sha256: "0".repeat(64) } }, "bad-theme"),
    /real lowercase digest/,
  );
  assert.throws(
    () => validateCatalog([sample, structuredClone(sample)]),
    /duplicate slug/,
  );
});

test("preview-only themes cannot accidentally expose a package", async () => {
  const preview = JSON.parse(await readFile(new URL("../catalog/themes/aurora-drift.json", import.meta.url), "utf8"));
  assert.equal(preview.package, null);
  assert.doesNotThrow(() => validateTheme(preview, "preview"));
  assert.throws(
    () => validateTheme({ ...preview, package: { published: false } }, "preview"),
    /unknown or missing fields|must be published/,
  );
});

test("GitHub Pages build is static and uses the repository base path", async () => {
  const [layout, config, packageJson, workflow, catalogWorkflow] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../next.config.ts", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../.github/workflows/pages.yml", import.meta.url), "utf8"),
    readFile(new URL("../.github/workflows/catalog.yml", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(layout, /next\/headers|await headers/);
  assert.match(config, /output:\s*"export"/);
  assert.match(config, /Codex-Skin-Store/);
  assert.match(packageJson, /build:pages/);
  assert.match(workflow, /deploy-pages@v5/);
  assert.match(workflow, /catalog:check/);
  assert.match(catalogWorkflow, /npm run catalog:check/);
  assert.match(catalogWorkflow, /npm run build:pages/);
});
