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
  assert.doesNotMatch(source, /javascript|text\/html|application\/x-executable/i);
});

test("submission issue accepts workshop bundles instead of prebuilt signed packages", async () => {
  const form = await readFile(new URL("../.github/ISSUE_TEMPLATE/theme-submission.yml", import.meta.url), "utf8");
  assert.match(form, /标准投稿包/);
  assert.match(form, /codex-skin-submission-\*\.zip/);
  assert.doesNotMatch(form, /签名 \.dreamskin Release 地址/);
  assert.doesNotMatch(form, /主题源码或发布仓库/);
});
