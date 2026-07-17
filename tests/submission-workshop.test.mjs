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
  assert.match(source, /validateSubmissionAssets/);
  assert.match(source, /sameFileContents/);
  assert.match(source, /creator-submitted-assets/);
  assert.match(source, /至少 20 个字符/);
  assert.doesNotMatch(source, /javascript|text\/html|application\/x-executable/i);
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
  assert.match(workflow, /import-theme-submission\.mjs/);
  assert.match(workflow, /gh pr create --draft/);
  assert.doesNotMatch(workflow, /^\s*issues:\s*$/m);
});
