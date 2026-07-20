import { strToU8, zip } from "fflate";

export const CATEGORY_OPTIONS = [
  { value: "gradient", label: "渐变", desktop: "其他" },
  { value: "nature", label: "风景", desktop: "风景" },
  { value: "minimal", label: "极简", desktop: "极简" },
  { value: "dark", label: "深色", desktop: "其他" },
  { value: "editorial", label: "个性", desktop: "其他" },
] as const;

export type SubmissionDraft = {
  slug: string;
  name: string;
  author: string;
  handle: string;
  summary: string;
  category: (typeof CATEGORY_OPTIONS)[number]["value"];
  variant: "light" | "dark";
  accent: string;
  ink: string;
  surface: string;
  backgroundFocusX: number;
  backgroundFocusY: number;
  visualIntensity: "clear" | "balanced" | "immersive";
  ambientEffect: "none" | "rain" | "particles" | "storm";
  effectIntensity: "subtle" | "balanced" | "vivid";
  effectPositionX: number;
  effectPositionY: number;
  effectWidthPercent: number;
  composerAccentWidthPx: number;
  brand: string;
  title: string;
  subtitle: string;
  composerHint: string;
  licenseNotes: string;
};

export const DEFAULT_SUBMISSION: SubmissionDraft = {
  slug: "my-first-theme",
  name: "我的第一个主题",
  author: "",
  handle: "",
  summary: "一个清晰、舒适，适合日常使用的 Codex 主题。",
  category: "minimal",
  variant: "light",
  accent: "#635bff",
  ink: "#20212a",
  surface: "#f7f6f2",
  backgroundFocusX: 50,
  backgroundFocusY: 50,
  visualIntensity: "balanced",
  ambientEffect: "none",
  effectIntensity: "balanced",
  effectPositionX: 72,
  effectPositionY: 28,
  effectWidthPercent: 42,
  composerAccentWidthPx: 120,
  brand: "FOCUS",
  title: "今天想构建什么？",
  subtitle: "让界面安静下来，把注意力留给正在创造的东西。",
  composerHint: "向 Codex 说明你想完成的工作",
  licenseNotes: "",
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)+$/;
const HANDLE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38}[A-Za-z0-9])?$/;
const COLOR = /^#[0-9a-fA-F]{6}$/;
export const PREVIEW_MAX_BYTES = 2 * 1024 * 1024;
export const PREVIEW_MIN_WIDTH = 1200;
export const PREVIEW_MIN_HEIGHT = 750;
export const PREVIEW_MAX_DIMENSION = 2400;
export const BACKGROUND_MAX_BYTES = 16 * 1024 * 1024;
export const BACKGROUND_MAX_DIMENSION = 8192;
export const EFFECT_MAX_BYTES = 4 * 1024 * 1024;
export const EFFECT_MAX_DIMENSION = 4096;

export function validateSubmission(draft: SubmissionDraft, preview?: File) {
  const errors: string[] = [];
  if (!SLUG.test(draft.slug) || draft.slug.length > 64) errors.push("主题 ID 需要两个以上小写英文/数字单词，并用连字符连接");
  if (!draft.name.trim() || draft.name.length > 60) errors.push("主题名称需要 1–60 个字符");
  if (!draft.author.trim() || draft.author.length > 60) errors.push("请填写作者名称");
  if (!HANDLE.test(draft.handle)) errors.push("GitHub 用户名格式不正确");
  if (!draft.summary.trim() || draft.summary.length > 120) errors.push("主题简介需要 1–120 个字符");
  if (![draft.accent, draft.ink, draft.surface].every((value) => COLOR.test(value))) errors.push("主题颜色必须是六位十六进制颜色");
  if (![draft.backgroundFocusX, draft.backgroundFocusY].every((value) => Number.isInteger(value) && value >= 0 && value <= 100)) errors.push("背景主体焦点需要在 0–100 之间");
  if (!["clear", "balanced", "immersive"].includes(draft.visualIntensity)) errors.push("视觉强度无效");
  if (!["none", "rain", "particles", "storm"].includes(draft.ambientEffect)) errors.push("氛围特效无效");
  if (!["subtle", "balanced", "vivid"].includes(draft.effectIntensity)) errors.push("特效强度无效");
  if (![draft.effectPositionX, draft.effectPositionY].every((value) => Number.isInteger(value) && value >= 0 && value <= 100)) errors.push("瞬时素材位置需要在 0–100 之间");
  if (!Number.isInteger(draft.effectWidthPercent) || draft.effectWidthPercent < 10 || draft.effectWidthPercent > 80) errors.push("瞬时素材宽度需要在 10–80 之间");
  if (!Number.isInteger(draft.composerAccentWidthPx) || draft.composerAccentWidthPx < 48 || draft.composerAccentWidthPx > 240) errors.push("输入框装饰宽度需要在 48–240 之间");
  if (!draft.brand.trim() || !draft.title.trim()) errors.push("品牌文字和首页标题不能为空");
  const licenseNotes = draft.licenseNotes.trim();
  if (licenseNotes.length < 20) errors.push("请用至少 20 个字符说明每项素材的作者、来源和再分发许可");
  if (licenseNotes && !/(原创|授权|许可|版权|license|https?:\/\/|\b(?:CC|MIT|Apache|GPL)\b)/i.test(licenseNotes)) {
    errors.push("素材说明需要明确原创、授权、许可证名称或来源链接");
  }
  if (!preview) errors.push("请上传一张 PNG 真实效果预览图");
  return errors;
}

export async function validateSubmissionAssets(preview?: File, background?: File, effectOverlay?: File, composerAccent?: File) {
  const errors: string[] = [];
  if (preview) {
    if (preview.type !== "image/png") errors.push("真实效果预览图必须是 PNG");
    if (preview.size > PREVIEW_MAX_BYTES) errors.push("预览图不能超过 2 MB");
    const dimensions = await validateDimensions(preview, "预览图", PREVIEW_MAX_DIMENSION, errors);
    if (dimensions && (dimensions.width < PREVIEW_MIN_WIDTH || dimensions.height < PREVIEW_MIN_HEIGHT)) {
      errors.push(`预览图至少需要 ${PREVIEW_MIN_WIDTH}×${PREVIEW_MIN_HEIGHT} 像素（当前 ${dimensions.width}×${dimensions.height}）`);
    }
    if (dimensions && (dimensions.width / dimensions.height < 1.45 || dimensions.width / dimensions.height > 1.75)) {
      errors.push("预览图需要接近 16:10 的横向真实界面截图");
    }
  }
  if (background) {
    if (!["image/png", "image/jpeg"].includes(background.type)) errors.push("背景图只接受 PNG 或 JPEG");
    if (background.size > BACKGROUND_MAX_BYTES) errors.push("背景图不能超过 16 MB");
    await validateDimensions(background, "背景图", BACKGROUND_MAX_DIMENSION, errors);
  }
  for (const [file, label] of [[effectOverlay, "瞬时叠加素材"], [composerAccent, "输入框装饰素材"]] as const) {
    if (!file) continue;
    if (file.type !== "image/png") errors.push(`${label}必须是支持透明背景的 PNG`);
    if (file.size > EFFECT_MAX_BYTES) errors.push(`${label}不能超过 4 MB`);
    await validateDimensions(file, label, EFFECT_MAX_DIMENSION, errors);
  }
  const supplied = [preview, background, effectOverlay, composerAccent].filter((file): file is File => Boolean(file));
  for (let left = 0; left < supplied.length; left += 1) for (let right = left + 1; right < supplied.length; right += 1) {
    if (await sameFileContents(supplied[left], supplied[right])) errors.push("预览图、背景图和特效素材不能直接复用同一个文件");
  }
  return errors;
}

async function validateDimensions(file: File, label: string, limit: number, errors: string[]) {
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    bitmap.close();
    if (width > limit || height > limit) errors.push(`${label}尺寸不能超过 ${limit}×${limit} 像素（当前 ${width}×${height}）`);
    return { width, height };
  } catch {
    errors.push(`${label}无法解码，请重新导出图片`);
    return undefined;
  }
}

async function sameFileContents(left: File, right: File) {
  if (left.size !== right.size) return false;
  const [leftBytes, rightBytes] = await Promise.all([left.arrayBuffer(), right.arrayBuffer()]);
  const [leftHash, rightHash] = await Promise.all([crypto.subtle.digest("SHA-256", leftBytes), crypto.subtle.digest("SHA-256", rightBytes)]);
  return new Uint8Array(leftHash).every((value, index) => value === new Uint8Array(rightHash)[index]);
}

function hexToRgb(hex: string) {
  return [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16));
}

function mix(hex: string, target: number, ratio: number) {
  const mixed = hexToRgb(hex).map((channel) => Math.round(channel * (1 - ratio) + target * ratio));
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function nearestColor(hex: string) {
  const [r, g, b] = hexToRgb(hex);
  if (Math.max(r, g, b) < 72) return "black";
  if (Math.max(r, g, b) - Math.min(r, g, b) < 28) return "neutral";
  if (r > 190 && g < 150) return r > b * 1.25 ? "orange" : "rose";
  if (b > r * 1.25) return r > 110 ? "violet" : "blue";
  if (g > r * 1.15) return b > 120 ? "teal" : "green";
  return "violet";
}

function backgroundExtension(file: File) {
  return ({ "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/avif": "avif" })[file.type];
}

export function createThemeManifests(draft: SubmissionDraft, hasBackground: boolean, backgroundExt = "jpg", hasEffectOverlay = false, hasComposerAccent = false) {
  const desktopCategory = CATEGORY_OPTIONS.find((item) => item.value === draft.category)?.desktop ?? "其他";
  const backgroundImage = hasBackground ? `../backgrounds/${draft.slug}.${backgroundExt}` : undefined;
  const desktop = {
    $schema: "../schemas/theme-v1.schema.json",
    schemaVersion: 1,
    version: "1.0.0",
    displayName: draft.name.trim(),
    codeThemeId: draft.slug,
    category: desktopCategory,
    description: draft.summary.trim(),
    author: draft.author.trim(),
    variant: draft.variant,
    previewImage: `../previews/${draft.slug}.png`,
    theme: {
      accent: draft.accent,
      ink: draft.ink,
      surface: draft.surface,
      contrast: 55,
      opaqueWindows: true,
      ...(backgroundImage ? {
        backgroundImage,
        backgroundFocus: { x: draft.backgroundFocusX, y: draft.backgroundFocusY },
        visualIntensity: draft.visualIntensity,
        backgroundImageOpacity: 1,
        backgroundImageBlur: 0,
      } : {}),
      ...((draft.ambientEffect !== "none" || hasEffectOverlay || hasComposerAccent) ? {
        effects: {
          ambient: draft.ambientEffect,
          intensity: draft.effectIntensity,
          ...(hasEffectOverlay ? { overlay: { image: `../effects/${draft.slug}-overlay.png`, triggers: ["task-start", "message-send"], position: { x: draft.effectPositionX, y: draft.effectPositionY }, widthPercent: draft.effectWidthPercent } } : {}),
          ...(hasComposerAccent ? { composerAccent: { image: `../effects/${draft.slug}-composer.png`, triggers: ["task-start"], widthPx: draft.composerAccentWidthPx } } : {}),
        },
      } : {}),
      fonts: {
        ui: "\"Microsoft YaHei UI\", \"PingFang SC\", \"Segoe UI\", sans-serif",
        display: "\"Microsoft YaHei UI\", \"PingFang SC\", \"Segoe UI\", sans-serif",
        code: "\"Cascadia Code\", \"SFMono-Regular\", monospace",
      },
      semanticColors: { diffAdded: "#18864B", diffRemoved: "#C43D4B", skill: draft.accent },
    },
    home: {
      brand: draft.brand.trim(),
      eyebrow: "CODEX COMMUNITY THEME",
      badge: "NEW",
      title: draft.title.trim(),
      subtitle: draft.subtitle.trim(),
      footerNote: `Theme by ${draft.author.trim()}`,
      composerHint: draft.composerHint.trim(),
      tags: ["社区主题", draft.variant === "dark" ? "深色" : "浅色", "专注"],
      sidebarLabels: { newTask: "新建任务", scheduled: "已安排", plugins: "插件", settings: "设置" },
      quickActions: [
        { icon: "</>", title: "理解代码", description: "梳理结构和关键流程", prompt: "请概览当前代码库的结构、关键模块和主要流程。" },
        { icon: "+", title: "构建功能", description: "实现可运行的新能力", prompt: "请基于当前项目实现一个新功能，并完成必要验证。" },
        { icon: "✓", title: "审查代码", description: "查找缺陷和回归风险", prompt: "请审查当前代码，优先指出缺陷、风险和缺失测试。" },
        { icon: "!", title: "修复问题", description: "定位根因并验证修复", prompt: "请诊断当前问题，修复根因并验证修复结果。" },
      ],
    },
    copy: {
      title: `Codex ${draft.name.trim()}`,
      replacePlaceholders: { "Ask Codex": draft.composerHint.trim(), "Ask Codex anything": draft.composerHint.trim() },
    },
  };

  const catalog = {
    slug: draft.slug,
    name: draft.name.trim(),
    summary: draft.summary.trim(),
    author: { name: draft.author.trim(), handle: draft.handle, curated: false },
    category: draft.category,
    platforms: ["macos", "windows"],
    colors: [nearestColor(draft.accent)],
    tags: ["社区主题", draft.variant === "dark" ? "深色" : "浅色", "双平台"],
    stats: { downloads: 0, rating: 0, reviews: 0 },
    featured: false,
    isNew: true,
    version: "1.0.0",
    engineRange: ">=1.0.0 <2.0.0",
    publishedAt: new Date().toISOString(),
    license: { name: "Codex-Skin Theme Assets", spdx: "LicenseRef-Codex-Skin-Theme", source: "creator-submitted-assets" },
    package: null,
    previewImage: `/theme-previews/${draft.slug}.png`,
    previewStyle: {
      backgroundColor: draft.surface,
      backgroundImage: `linear-gradient(145deg, ${draft.surface}, ${mix(draft.accent, draft.variant === "dark" ? 0 : 255, 0.78)})`,
      panelColor: draft.surface,
      panelBorder: mix(draft.ink, draft.variant === "dark" ? 255 : 0, 0.78),
      textColor: draft.ink,
      mutedTextColor: mix(draft.ink, draft.variant === "dark" ? 255 : 0, 0.42),
      accentColor: draft.accent,
      accentSoft: mix(draft.accent, draft.variant === "dark" ? 0 : 255, 0.78),
      codeColor: draft.accent,
      shadow: `0 28px 80px ${mix(draft.accent, 0, 0.45)}55`,
      pattern: draft.category === "nature" ? "mist" : draft.category === "dark" ? "grid" : "paper",
    },
  };
  return { desktop, catalog };
}

export async function createSubmissionArchive(draft: SubmissionDraft, preview: File, background?: File, effectOverlay?: File, composerAccent?: File) {
  const errors = [...validateSubmission(draft, preview), ...await validateSubmissionAssets(preview, background, effectOverlay, composerAccent)];
  if (errors.length) throw new Error(errors.join("；"));
  const extension = background ? backgroundExtension(background) : undefined;
  const { desktop, catalog } = createThemeManifests(draft, Boolean(background), extension, Boolean(effectOverlay), Boolean(composerAccent));
  const encoder = (value: unknown) => strToU8(`${JSON.stringify(value, null, 2)}\n`);
  const previewBytes = new Uint8Array(await preview.arrayBuffer());
  const files: Record<string, Uint8Array> = {
    [`themes/${draft.slug}.json`]: encoder(desktop),
    [`catalog/themes/${draft.slug}.json`]: encoder(catalog),
    [`previews/${draft.slug}.png`]: previewBytes,
    [`public/theme-previews/${draft.slug}.png`]: previewBytes,
    "SUBMISSION.md": strToU8(`# ${draft.name}\n\n作者：${draft.author} (@${draft.handle})\n\n## 素材与许可\n\n${draft.licenseNotes}\n\n## 投稿说明\n\n此投稿包由 Codex-Skin-Store 主题工坊生成。包内只有声明式 JSON 与图片；维护者审核后由可信 CI 构建、签名和发布。\n`),
  };
  if (background && extension) files[`backgrounds/${draft.slug}.${extension}`] = new Uint8Array(await background.arrayBuffer());
  if (effectOverlay) files[`effects/${draft.slug}-overlay.png`] = new Uint8Array(await effectOverlay.arrayBuffer());
  if (composerAccent) files[`effects/${draft.slug}-composer.png`] = new Uint8Array(await composerAccent.arrayBuffer());
  const archive = await new Promise<Uint8Array>((resolve, reject) => {
    zip(files, { level: 6 }, (error, data) => error ? reject(error) : resolve(data));
  });
  return new Blob([archive as BlobPart], { type: "application/zip" });
}
