import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("theme workshop generates the complete review bundle", async () => {
  const source = await readFile(new URL("../lib/theme-submission.ts", import.meta.url), "utf8");
  for (const path of [
    "themes/${draft.slug}.json",
    "catalog/themes/${draft.slug}.json",
    "previews/${draft.slug}.png",
    "public/theme-previews/${draft.slug}.png",
    "SUBMISSION.md",
  ]) {
    assert.match(source, new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(source, /package: null/);
  assert.match(source, /zip\(files/);
  assert.match(source, /image\/png/);
  assert.match(source, /PREVIEW_MAX_BYTES = 2 \* 1024 \* 1024/);
  assert.match(source, /PREVIEW_MIN_WIDTH = 1200/);
  assert.match(source, /PREVIEW_MIN_HEIGHT = 750/);
  assert.match(source, /PREVIEW_MAX_DIMENSION = 2400/);
  assert.match(source, /BACKGROUND_MAX_BYTES = 16 \* 1024 \* 1024/);
  assert.match(source, /BACKGROUND_MAX_DIMENSION = 8192/);
  assert.match(source, /EFFECT_MAX_BYTES = 4 \* 1024 \* 1024/);
  assert.match(source, /effects\/\$\{draft\.slug\}-overlay\.png/);
  assert.match(source, /effects\/\$\{draft\.slug\}-composer\.png/);
  assert.match(source, /validateSubmissionAssets/);
  assert.match(source, /sameFileContents/);
  assert.match(source, /creator-submitted-assets/);
  assert.match(source, /backgroundFocus: \{ x: draft\.backgroundFocusX, y: draft\.backgroundFocusY \}/);
  assert.match(source, /visualIntensity: draft\.visualIntensity/);
  assert.match(source, /至少 20 个字符/);
  assert.doesNotMatch(source, /javascript|text\/html|application\/x-executable/i);
});

test("theme workshop supports image-derived colors and precise focus controls", async () => {
  const [workshop, palette] = await Promise.all([
    readFile(new URL("../components/theme-workshop.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/image-palette.ts", import.meta.url), "utf8"),
  ]);
  assert.match(workshop, /extractImagePalette/);
  assert.match(workshop, /应用自动配色/);
  assert.match(workshop, /backgroundFocusX/);
  assert.match(workshop, /backgroundFocusY/);
  assert.match(workshop, /immersive/);
  assert.match(workshop, /氛围特效/);
  assert.match(workshop, /任务瞬时叠加素材/);
  assert.match(palette, /64 \/ Math\.max/);
  assert.match(palette, /createImageBitmap/);
  assert.match(palette, /getImageData/);
});

test("submission issue accepts workshop bundles instead of prebuilt signed packages", async () => {
  const form = await readFile(new URL("../.github/ISSUE_TEMPLATE/theme-submission.yml", import.meta.url), "utf8");
  assert.match(form, /标准投稿包/);
  assert.match(form, /codex-skin-submission-\*\.zip/);
  assert.doesNotMatch(form, /签名 \.dreamskin Release 地址/);
  assert.doesNotMatch(form, /主题源码或发布仓库/);
  assert.doesNotMatch(form, /id: license/);
  const workflow = await readFile(new URL("../.github/workflows/review-theme-submission.yml", import.meta.url), "utf8");
  assert.match(workflow, /workflow_dispatch/);
  assert.match(workflow, /issues:\s*\n\s*types: \[opened\]/);
  assert.match(workflow, /github\.event\.issue\.number \|\| inputs\.issue_number/);
  assert.match(workflow, /contains\(github\.event\.issue\.labels\.\*\.name, 'theme-submission'\)/);
  assert.match(workflow, /import-theme-submission\.mjs/);
  assert.match(workflow, /NEXT_PUBLIC_SITE_URL=https:\/\/lixiaobaivv\.github\.io\/Codex-Skin-Store\/ npm run build:pages/);
  assert.doesNotMatch(workflow, /env:\s*\n\s*BUILD_GITHUB_PAGES: "true"/);
  assert.match(workflow, /gh pr create --draft/);
  const desktopFeed = await readFile(new URL("../tools/build-desktop-feed.mjs", import.meta.url), "utf8");
  assert.match(desktopFeed, /manifest\.theme\?\.backgroundImage, "backgrounds", true/);
});
