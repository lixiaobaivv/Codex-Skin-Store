import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";
import { validateCatalog, validateTheme } from "../tools/validate-catalog.mjs";

const schemaUrl = new URL("../spec/theme-package.schema.json", import.meta.url);
const RELEASE_PACKAGE_URL = /^https:\/\/github\.com\/lixiaobaivv\/Codex-Skin\/releases\/download\/(?:official-themes-v[1-9][0-9]*|theme-[a-z0-9]+(?:-[a-z0-9]+)*-v\d+\.\d+\.\d+)\/Codex-Skin-theme-/;

test("theme package schema stays declarative and closed", async () => {
  const schema = JSON.parse(await readFile(schemaUrl, "utf8"));

  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.equal(schema.additionalProperties, false);
  assert.ok(schema.required.includes("signature"));
  assert.ok(schema.required.includes("assets"));

  const themeSchema = JSON.parse(await readFile(new URL("../schemas/theme-v1.schema.json", import.meta.url), "utf8"));
  assert.equal("backgroundFit" in themeSchema.properties.theme.properties, false);

  const source = JSON.stringify(schema);
  assert.doesNotMatch(source, /javascript|text\/css|image\/svg\+xml/i);
  assert.match(source, /image\/png/);
  assert.match(source, /image\/webp/);
  assert.match(source, /Ed25519/);
});

test("storefront catalogs and enables the official themes", async () => {
  const [storefront, catalogEntry, generated, links] = await Promise.all([
    readFile(new URL("../components/storefront.tsx", import.meta.url), "utf8"),
    readFile(new URL("../catalog/themes/jackson-sage.json", import.meta.url), "utf8"),
    readFile(new URL("../lib/generated-themes.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/dreamskin-link.ts", import.meta.url), "utf8"),
  ]);

  assert.match(storefront, /一键导入/);
  assert.match(storefront, /手动下载/);
  assert.doesNotMatch(storefront, /PROTOCOL_PREVIEW_SHA256|dreamskin\.store\/packages/);
  assert.match(catalogEntry, /releases\/download\/official-themes-v1\/Codex-Skin-theme-jackson-sage-1\.0\.0\.dreamskin/);
  assert.match(catalogEntry, /d737eb406bcb8612c6ff4814a2e9644287617dcc23d78fa99b2f698cb02c4abd/);
  assert.match(catalogEntry, /"size": 1233340/);
  assert.match(catalogEntry, /"published": true/);
  assert.match(generated, /"slug": "jackson-sage"/);
  assert.match(generated, /theme-previews\/jackson-sage\.png/);
  assert.match(storefront, /theme\.package\?\.published/);
  assert.match(storefront, /NEXT_PUBLIC_BASE_PATH/);
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
  assert.deepEqual(schema.properties.license.properties.source.enum, ["project-curated-assets", "creator-submitted-assets"]);
});

test("catalog validation rejects placeholders, unknown fields, and duplicates", async () => {
  const sample = JSON.parse(await readFile(new URL("../catalog/themes/jackson-sage.json", import.meta.url), "utf8"));

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
  assert.throws(
    () => validateTheme({ ...sample, slug: "single", package: null }, "bad-theme"),
    /package-compatible slug/,
  );
  assert.doesNotThrow(() => validateTheme({ ...sample, license: { ...sample.license, source: "creator-submitted-assets" } }, "community-theme"));
  assert.throws(
    () => validateTheme({ ...sample, license: { ...sample.license, source: "unknown" } }, "bad-theme"),
    /unsupported license declaration/,
  );
});

test("storefront exactly matches the desktop theme repository", async () => {
  assert.match(
    "https://github.com/lixiaobaivv/Codex-Skin/releases/download/theme-user-upload-test-v1.0.0/Codex-Skin-theme-user-upload-test-1.0.0.dreamskin",
    RELEASE_PACKAGE_URL,
  );
  const directory = new URL("../catalog/themes/", import.meta.url);
  const files = (await readdir(directory)).filter((name) => name.endsWith(".json")).sort();
  const themes = await Promise.all(files.map((name) => readFile(new URL(name, directory), "utf8").then(JSON.parse)));
  const desktopIndex = JSON.parse(await readFile(new URL("../theme-repository.json", import.meta.url), "utf8"));
  const desktopIds = desktopIndex.themes.map(entry => entry.id).sort();
  assert.equal(themes.length, desktopIds.length);
  assert.deepEqual(themes.map(theme => theme.slug).sort(), desktopIds);
  const publishedThemes = themes.filter((theme) => theme.package?.published);
  assert.ok(publishedThemes.length > 0);
  assert.equal(
    new Set(publishedThemes.map((theme) => `${theme.package.id}@${theme.package.version}`)).size,
    publishedThemes.length,
  );
  assert.doesNotThrow(() => validateCatalog(themes));
  for (const theme of themes) {
    if (theme.package) {
      assert.equal(theme.package.id, theme.slug);
      assert.match(theme.package.url, RELEASE_PACKAGE_URL);
    }
    await readFile(new URL(`../public${theme.previewImage}`, import.meta.url));
  }

  const draft = { ...themes[0], slug: "future-draft", package: null };
  assert.doesNotThrow(() => validateTheme(draft, "draft"));
  assert.throws(
    () => validateTheme({ ...draft, package: { published: false } }, "draft"),
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
  assert.match(config, /BUILD_GITHUB_PAGES/);
  assert.doesNotMatch(config, /process\.env\.GITHUB_ACTIONS/);
  assert.match(packageJson, /build:pages/);
  assert.match(workflow, /deploy-pages@v5/);
  assert.match(workflow, /catalog:check/);
  assert.match(catalogWorkflow, /npm run catalog:check/);
  assert.match(catalogWorkflow, /npm run build:pages/);
});

test("preview-only drafts stay out of the public storefront", async () => {
  const themes = await readFile(new URL("../lib/themes.ts", import.meta.url), "utf8");
  assert.match(themes, /GENERATED_THEMES\.filter/);
  assert.match(themes, /theme\.package\?\.published === true/);
});
