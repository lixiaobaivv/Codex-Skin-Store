import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { strToU8, zipSync } from "fflate";
import { findSubmissionUrl } from "../tools/download-theme-submission.mjs";
import { importThemeSubmission } from "../tools/import-theme-submission.mjs";

const slug = "workshop-fixture";

function desktopManifest() {
  return {
    $schema: "../schemas/theme-v1.schema.json",
    schemaVersion: 1,
    version: "1.0.0",
    displayName: "Workshop Fixture",
    codeThemeId: slug,
    category: "极简",
    description: "自动导入器的测试主题",
    author: "Fixture Author",
    variant: "light",
    previewImage: `../previews/${slug}.png`,
    theme: { accent: "#635bff", ink: "#20212a", surface: "#f7f6f2" },
    home: {
      brand: "FIXTURE",
      title: "Test safely",
      quickActions: [
        { title: "One", prompt: "One" },
        { title: "Two", prompt: "Two" },
        { title: "Three", prompt: "Three" },
        { title: "Four", prompt: "Four" },
      ],
    },
  };
}

function catalogEntry() {
  return {
    slug,
    name: "Workshop Fixture",
    summary: "A safe automated import fixture.",
    author: { name: "Fixture Author", handle: "fixture-author", curated: false },
    category: "minimal",
    platforms: ["macos", "windows"],
    colors: ["violet"],
    tags: ["fixture"],
    stats: { downloads: 0, rating: 0, reviews: 0 },
    featured: false,
    isNew: true,
    version: "1.0.0",
    engineRange: ">=1.0.0 <2.0.0",
    publishedAt: "2026-07-18T00:00:00.000Z",
    license: { name: "Codex-Skin Theme Assets", spdx: "LicenseRef-Codex-Skin-Theme", source: "creator-submitted-assets" },
    package: null,
    previewImage: `/theme-previews/${slug}.png`,
    previewStyle: {
      backgroundColor: "#f7f6f2",
      backgroundImage: "linear-gradient(#f7f6f2, #dddbff)",
      panelColor: "#f7f6f2",
      panelBorder: "#dddddd",
      textColor: "#20212a",
      mutedTextColor: "#666666",
      accentColor: "#635bff",
      accentSoft: "#dddbff",
      codeColor: "#635bff",
      shadow: "0 20px 60px #00000022",
      pattern: "paper",
    },
  };
}

async function fixtureArchive(overrides = {}) {
  const preview = new Uint8Array(await readFile(new URL("../public/theme-previews/dilraba-star.png", import.meta.url)));
  const files = {
    [`themes/${slug}.json`]: strToU8(JSON.stringify(desktopManifest())),
    [`catalog/themes/${slug}.json`]: strToU8(JSON.stringify(catalogEntry())),
    [`previews/${slug}.png`]: preview,
    [`public/theme-previews/${slug}.png`]: preview,
    "SUBMISSION.md": strToU8("# Workshop Fixture\n\n作者：Fixture Author (@fixture-author)\n\n## 素材与许可\n\n主题和预览图均为 Fixture Author 原创，并授权项目公开展示与再分发。\n\n## 投稿说明\n\nFixture\n"),
    ...overrides,
  };
  return zipSync(files, { level: 1 });
}

async function emptyRepository() {
  const root = await mkdtemp(join(tmpdir(), "codex-skin-submission-"));
  await writeFile(join(root, "theme-repository.json"), JSON.stringify({ schemaVersion: 1, name: "Fixture", updatedAt: "2026-01-01T00:00:00Z", themes: [] }));
  return root;
}

test("imports a validated workshop bundle and records its Issue provenance", async () => {
  const root = await emptyRepository();
  const archivePath = join(root, "submission.zip");
  await writeFile(archivePath, await fixtureArchive());
  const result = await importThemeSubmission({ archivePath, root, issueUrl: "https://github.com/example/store/issues/7" });
  assert.equal(result.slug, slug);
  const repository = JSON.parse(await readFile(join(root, "theme-repository.json"), "utf8"));
  assert.deepEqual(repository.themes, [{ id: slug, manifest: `themes/${slug}.json` }]);
  assert.match(await readFile(join(root, `submissions/${slug}.md`), "utf8"), /issues\/7/);
  assert.deepEqual(await readFile(join(root, `previews/${slug}.png`)), await readFile(join(root, `public/theme-previews/${slug}.png`)));
});

test("rejects traversal entries before writing files", async () => {
  const root = await emptyRepository();
  const archivePath = join(root, "unsafe.zip");
  await writeFile(archivePath, await fixtureArchive({ "../evil.txt": strToU8("unsafe") }));
  await assert.rejects(() => importThemeSubmission({ archivePath, root }), /不允许的文件路径/);
});

test("rejects a placeholder-sized image instead of treating it as a real preview", async () => {
  const root = await emptyRepository();
  const archivePath = join(root, "tiny.zip");
  const tinyPngHeader = Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,2,114,0,0,1,247]);
  await writeFile(archivePath, await fixtureArchive({
    [`previews/${slug}.png`]: tinyPngHeader,
    [`public/theme-previews/${slug}.png`]: tinyPngHeader,
  }));
  await assert.rejects(() => importThemeSubmission({ archivePath, root }), /至少需要 1200×750/);
});

test("rejects unknown manifest fields through the closed schema", async () => {
  const root = await emptyRepository();
  const archivePath = join(root, "unknown-field.zip");
  const manifest = { ...desktopManifest(), arbitraryCss: "body { display: none }" };
  await writeFile(archivePath, await fixtureArchive({ [`themes/${slug}.json`]: strToU8(JSON.stringify(manifest)) }));
  await assert.rejects(() => importThemeSubmission({ archivePath, root }), /桌面主题 Schema 无效.*additional properties/i);
});

test("extracts exactly one standard GitHub attachment URL from an Issue", () => {
  const url = "https://github.com/user-attachments/files/30127070/codex-skin-submission-my-theme-1.0.0.zip";
  assert.equal(findSubmissionUrl(`[bundle](${url})`), url);
  assert.throws(() => findSubmissionUrl("no attachment"), /找到 0 个/);
  assert.throws(() => findSubmissionUrl(`${url}\n${url}`), /找到 2 个/);
});
