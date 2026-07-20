import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { unzipSync } from "fflate";
import { validateTheme } from "./validate-catalog.mjs";

const DEFAULT_ROOT = fileURLToPath(new URL("../", import.meta.url));
const MAX_ARCHIVE_BYTES = 28 * 1024 * 1024;
const MAX_EXPANDED_BYTES = 28 * 1024 * 1024;
const MAX_ENTRIES = 8;
const PREVIEW_MAX_BYTES = 2 * 1024 * 1024;
const PREVIEW_MIN_WIDTH = 1200;
const PREVIEW_MIN_HEIGHT = 750;
const PREVIEW_MAX_DIMENSION = 2400;
const BACKGROUND_MAX_BYTES = 16 * 1024 * 1024;
const EFFECT_MAX_BYTES = 4 * 1024 * 1024;
const EFFECT_MAX_DIMENSION = 4096;
const ENTRY_PATTERN = /^(?:themes\/[a-z0-9-]+\.json|catalog\/themes\/[a-z0-9-]+\.json|previews\/[a-z0-9-]+\.png|public\/theme-previews\/[a-z0-9-]+\.png|backgrounds\/[a-z0-9-]+\.(?:png|jpg)|effects\/[a-z0-9-]+-(?:overlay|composer)\.png|SUBMISSION\.md)$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)+$/;
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validateDesktopSchema = ajv.compile(JSON.parse(await readFile(join(DEFAULT_ROOT, "schemas/theme-v1.schema.json"), "utf8")));
const validateStoreSchema = ajv.compile(JSON.parse(await readFile(join(DEFAULT_ROOT, "spec/store-theme.schema.json"), "utf8")));

function fail(message) {
  throw new Error(`投稿包校验失败：${message}`);
}

function decode(bytes, label) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    fail(`${label} 不是有效 UTF-8 文本`);
  }
}

function parseJson(bytes, label) {
  try {
    return JSON.parse(decode(bytes, label));
  } catch (error) {
    if (error.message.startsWith("投稿包校验失败")) throw error;
    fail(`${label} 不是有效 JSON：${error.message}`);
  }
}

function equalBytes(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function pngDimensions(bytes, label) {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length < 24 || !signature.every((value, index) => bytes[index] === value) || decode(bytes.subarray(12, 16), label) !== "IHDR") {
    fail(`${label} 不是有效 PNG`);
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

function validatePreview(bytes) {
  if (bytes.length > PREVIEW_MAX_BYTES) fail("真实效果预览不能超过 2 MB");
  const { width, height } = pngDimensions(bytes, "真实效果预览");
  if (width < PREVIEW_MIN_WIDTH || height < PREVIEW_MIN_HEIGHT) {
    fail(`真实效果预览至少需要 ${PREVIEW_MIN_WIDTH}×${PREVIEW_MIN_HEIGHT}（当前 ${width}×${height}）`);
  }
  if (width > PREVIEW_MAX_DIMENSION || height > PREVIEW_MAX_DIMENSION) {
    fail(`真实效果预览尺寸不能超过 ${PREVIEW_MAX_DIMENSION}×${PREVIEW_MAX_DIMENSION}`);
  }
  const ratio = width / height;
  if (ratio < 1.45 || ratio > 1.75) fail("真实效果预览应接近 16:10 横向界面截图");
}

function validateBackground(bytes, extension) {
  if (bytes.length > BACKGROUND_MAX_BYTES) fail("背景图不能超过 16 MB");
  if (extension === "png") {
    pngDimensions(bytes, "背景图");
    return;
  }
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes.at(-2) !== 0xff || bytes.at(-1) !== 0xd9) {
    fail("背景图扩展名为 JPG，但内容不是 JPEG");
  }
}

function validateEffect(bytes, label) {
  if (bytes.length > EFFECT_MAX_BYTES) fail(`${label}不能超过 4 MB`);
  const { width, height } = pngDimensions(bytes, label);
  if (width > EFFECT_MAX_DIMENSION || height > EFFECT_MAX_DIMENSION) fail(`${label}尺寸不能超过 ${EFFECT_MAX_DIMENSION}×${EFFECT_MAX_DIMENSION}`);
}

function licenseNotes(markdown) {
  const match = markdown.match(/## 素材与许可\s+([\s\S]*?)(?=\n## |$)/);
  const notes = match?.[1]?.trim() ?? "";
  if (notes.length < 20) fail("素材许可说明至少需要 20 个字符");
  if (!/(原创|授权|许可|版权|license|https?:\/\/|\b(?:CC|MIT|Apache|GPL)\b)/i.test(notes)) {
    fail("素材许可说明必须明确原创、授权、许可证名称或来源链接");
  }
  return notes;
}

function safeEntries(archiveBytes) {
  if (archiveBytes.length > MAX_ARCHIVE_BYTES) fail("ZIP 不能超过 28 MB");
  let count = 0;
  let expanded = 0;
  const names = new Set();
  const files = unzipSync(archiveBytes, {
    filter(entry) {
      count += 1;
      if (count > MAX_ENTRIES) fail(`文件数量不能超过 ${MAX_ENTRIES}`);
      const name = entry.name;
      if (!name || name.includes("\\") || name.startsWith("/") || name.includes("../") || name.includes("\0") || !ENTRY_PATTERN.test(name)) {
        fail(`不允许的文件路径：${name || "<empty>"}`);
      }
      if (names.has(name)) fail(`ZIP 包含重复文件：${name}`);
      names.add(name);
      expanded += entry.originalSize;
      if (expanded > MAX_EXPANDED_BYTES) fail("解压后总大小不能超过 28 MB");
      return true;
    },
  });
  return files;
}

function expectedPaths(slug, backgroundPath, effectPaths) {
  return new Set([
    `themes/${slug}.json`,
    `catalog/themes/${slug}.json`,
    `previews/${slug}.png`,
    `public/theme-previews/${slug}.png`,
    "SUBMISSION.md",
    ...(backgroundPath ? [backgroundPath] : []),
    ...effectPaths,
  ]);
}

function validateManifest(manifest, catalog, slug, backgroundPath, effectPaths) {
  if (!validateDesktopSchema(manifest)) fail(`桌面主题 Schema 无效：${ajv.errorsText(validateDesktopSchema.errors)}`);
  if (!validateStoreSchema(catalog)) fail(`商店主题 Schema 无效：${ajv.errorsText(validateStoreSchema.errors)}`);
  if (manifest.codeThemeId !== slug || catalog.slug !== slug) fail("文件名、桌面主题 ID 和商店 slug 必须一致");
  if (manifest.version !== catalog.version) fail("桌面主题版本与商店版本不一致");
  if (manifest.author !== catalog.author?.name) fail("桌面清单与商店条目的作者名称不一致");
  if (manifest.previewImage !== `../previews/${slug}.png` || catalog.previewImage !== `/theme-previews/${slug}.png`) fail("预览路径不符合主题 ID");
  if (catalog.package !== null) fail("投稿阶段 package 必须为 null");
  if (catalog.author?.curated !== false) fail("社区投稿不能标记为编辑精选作者");
  if (catalog.license?.source !== "creator-submitted-assets") fail("社区投稿的 license.source 必须为 creator-submitted-assets");
  if (backgroundPath) {
    if (manifest.theme?.backgroundImage !== `../${backgroundPath}`) fail("背景路径与 ZIP 内容不一致");
  } else if (manifest.theme?.backgroundImage) {
    fail("清单引用了 ZIP 中不存在的背景图");
  }
  const referencedEffects = [manifest.theme?.effects?.overlay?.image, manifest.theme?.effects?.composerAccent?.image]
    .filter(Boolean)
    .map((path) => path.replace(/^\.\.\//, ""))
    .sort();
  if (JSON.stringify(referencedEffects) !== JSON.stringify([...effectPaths].sort())) fail("特效素材路径与 ZIP 内容不一致");
  if (manifest.theme?.effects?.overlay?.image && manifest.theme.effects.overlay.image !== `../effects/${slug}-overlay.png`) fail("瞬时叠加素材路径与主题 ID 不一致");
  if (manifest.theme?.effects?.composerAccent?.image && manifest.theme.effects.composerAccent.image !== `../effects/${slug}-composer.png`) fail("输入框装饰素材路径与主题 ID 不一致");
  validateTheme(catalog, `catalog/themes/${slug}.json`);
}

function withinRoot(root, relativePath) {
  const target = resolve(root, relativePath);
  if (!target.startsWith(`${resolve(root)}${sep}`)) fail(`目标路径越界：${relativePath}`);
  return target;
}

export async function importThemeSubmission({ archivePath, root = DEFAULT_ROOT, checkOnly = false, issueUrl = "" }) {
  const archiveBytes = new Uint8Array(await readFile(archivePath));
  const files = safeEntries(archiveBytes);
  const themePaths = Object.keys(files).filter((name) => /^themes\/[^/]+\.json$/.test(name));
  if (themePaths.length !== 1) fail("必须且只能包含一个桌面主题清单");
  const slug = basename(themePaths[0], ".json");
  if (!SLUG.test(slug) || slug.length > 64) fail("主题 ID 格式不正确");

  const backgroundPaths = Object.keys(files).filter((name) => name.startsWith("backgrounds/"));
  if (backgroundPaths.length > 1) fail("只能包含一张背景图");
  const backgroundPath = backgroundPaths[0];
  const effectPaths = Object.keys(files).filter((name) => name.startsWith("effects/"));
  if (effectPaths.length > 2) fail("最多只能包含两张特效素材");
  const allowedEffectPaths = new Set([`effects/${slug}-overlay.png`, `effects/${slug}-composer.png`]);
  if (effectPaths.some((path) => !allowedEffectPaths.has(path))) fail("特效素材文件名必须与主题 ID 和素材角色一致");
  const expected = expectedPaths(slug, backgroundPath, effectPaths);
  const actual = new Set(Object.keys(files));
  assert.deepEqual([...actual].sort(), [...expected].sort(), "投稿包只能包含当前主题的标准文件");

  const manifest = parseJson(files[`themes/${slug}.json`], "桌面主题清单");
  const catalog = parseJson(files[`catalog/themes/${slug}.json`], "商店主题条目");
  validateManifest(manifest, catalog, slug, backgroundPath, effectPaths);

  const preview = files[`previews/${slug}.png`];
  const publicPreview = files[`public/theme-previews/${slug}.png`];
  validatePreview(preview);
  if (!equalBytes(preview, publicPreview)) fail("客户端预览与网页预览必须是同一张 PNG");
  if (backgroundPath) {
    const background = files[backgroundPath];
    validateBackground(background, backgroundPath.endsWith(".png") ? "png" : "jpg");
    if (equalBytes(preview, background)) fail("真实界面预览不能直接复用为主题背景图");
  }
  for (const effectPath of effectPaths) validateEffect(files[effectPath], effectPath.includes("-overlay.png") ? "瞬时叠加素材" : "输入框装饰素材");
  const submittedImages = [
    ["真实效果预览", preview],
    ...(backgroundPath ? [["背景图", files[backgroundPath]]] : []),
    ...effectPaths.map((path) => [path, files[path]]),
  ];
  for (let left = 0; left < submittedImages.length; left += 1) for (let right = left + 1; right < submittedImages.length; right += 1) {
    if (equalBytes(submittedImages[left][1], submittedImages[right][1])) fail(`${submittedImages[left][0]}与${submittedImages[right][0]}不能复用同一个文件`);
  }

  const submissionMarkdown = decode(files["SUBMISSION.md"], "SUBMISSION.md");
  licenseNotes(submissionMarkdown);
  const repositoryPath = join(root, "theme-repository.json");
  const repository = JSON.parse(await readFile(repositoryPath, "utf8"));
  if (!Array.isArray(repository.themes)) fail("目标仓库的 theme-repository.json 无效");
  if (repository.themes.some((entry) => entry.id === slug)) fail(`主题 ID 已存在：${slug}`);
  try {
    await readFile(join(root, `catalog/themes/${slug}.json`));
    fail(`商店 slug 已存在：${slug}`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const imported = [
    `themes/${slug}.json`,
    `catalog/themes/${slug}.json`,
    `previews/${slug}.png`,
    `public/theme-previews/${slug}.png`,
    ...(backgroundPath ? [backgroundPath] : []),
    ...effectPaths,
  ];
  if (!checkOnly) {
    for (const relativePath of imported) {
      const target = withinRoot(root, relativePath);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, files[relativePath]);
    }
    const reviewPath = `submissions/${slug}.md`;
    const provenance = issueUrl ? `\n\n## 审核来源\n\n${issueUrl}\n` : "";
    await mkdir(join(root, "submissions"), { recursive: true });
    await writeFile(withinRoot(root, reviewPath), `${submissionMarkdown.trim()}${provenance}\n`);
    repository.themes.push({ id: slug, manifest: `themes/${slug}.json` });
    repository.themes.sort((left, right) => left.id.localeCompare(right.id));
    repository.updatedAt = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
    await writeFile(repositoryPath, `${JSON.stringify(repository, null, 2)}\n`);
    imported.push(reviewPath, "theme-repository.json");
  }

  return {
    slug,
    name: catalog.name,
    authorHandle: catalog.author.handle,
    archiveSha256: createHash("sha256").update(archiveBytes).digest("hex"),
    imported,
  };
}

function argument(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

async function main() {
  const archivePath = argument("--archive", process.argv[2]);
  if (!archivePath) throw new Error("用法：node tools/import-theme-submission.mjs --archive <submission.zip> [--root <repo>] [--check-only]");
  const result = await importThemeSubmission({
    archivePath,
    root: resolve(argument("--root", DEFAULT_ROOT)),
    checkOnly: process.argv.includes("--check-only"),
    issueUrl: argument("--issue-url"),
  });
  console.log(`投稿包有效：${result.slug} · ${result.name} · SHA-256 ${result.archiveSha256}`);
  const output = process.env.GITHUB_OUTPUT;
  if (output) {
    await writeFile(output, `theme_id=${result.slug}\ntheme_name=${result.name.replaceAll("\n", " ")}\nauthor_handle=${result.authorHandle}\n`, { flag: "a" });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
