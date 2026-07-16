import { GENERATED_THEMES } from "@/lib/generated-themes";

export const THEME_CATEGORY_VALUES = [
  "gradient",
  "nature",
  "minimal",
  "dark",
  "editorial",
] as const;

export type ThemeCategory = (typeof THEME_CATEGORY_VALUES)[number];

export const THEME_PLATFORM_VALUES = ["macos", "windows"] as const;

export type ThemePlatform = (typeof THEME_PLATFORM_VALUES)[number];

export const THEME_COLOR_VALUES = [
  "blue",
  "violet",
  "green",
  "teal",
  "rose",
  "orange",
  "neutral",
  "black",
] as const;

export type ThemeColor = (typeof THEME_COLOR_VALUES)[number];

export type ThemeSort = "featured" | "popular" | "newest" | "rating";

export interface ThemeAuthor {
  readonly name: string;
  readonly handle: string;
  readonly curated: boolean;
}

export interface ThemeStats {
  readonly downloads: number;
  readonly rating: number;
  readonly reviews: number;
}

export interface ThemeLicense {
  readonly name: string;
  readonly spdx: "CC0-1.0";
  readonly source: "original-procedural-artwork";
}

export interface ThemePreviewStyle {
  readonly backgroundColor: string;
  readonly backgroundImage: string;
  readonly panelColor: string;
  readonly panelBorder: string;
  readonly textColor: string;
  readonly mutedTextColor: string;
  readonly accentColor: string;
  readonly accentSoft: string;
  readonly codeColor: string;
  readonly shadow: string;
  readonly pattern: "aurora" | "grid" | "paper" | "horizon" | "mist" | "orb" | "stars" | "embers";
}

export interface ThemePackage {
  readonly published: boolean;
  readonly id: string;
  readonly version: string;
  readonly url: `https://${string}`;
  readonly sha256: string;
  readonly size: number;
}

export interface Theme {
  readonly slug: string;
  readonly name: string;
  readonly summary: string;
  readonly author: ThemeAuthor;
  readonly category: ThemeCategory;
  readonly platforms: readonly ThemePlatform[];
  readonly colors: readonly ThemeColor[];
  readonly tags: readonly string[];
  readonly stats: ThemeStats;
  readonly featured: boolean;
  readonly isNew: boolean;
  readonly version: string;
  readonly engineRange: string;
  readonly publishedAt: string;
  readonly license: ThemeLicense;
  readonly previewStyle: ThemePreviewStyle;
  readonly package: ThemePackage | null;
}

export interface ThemeFilterOptions {
  readonly query?: string;
  readonly category?: ThemeCategory | "all";
  readonly platform?: ThemePlatform | "all";
  readonly color?: ThemeColor | "all";
  readonly featuredOnly?: boolean;
  readonly sort?: ThemeSort;
}

interface FilterOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

interface CategoryOption extends FilterOption<ThemeCategory | "all"> {
  readonly description: string;
}

export const THEME_CATEGORIES = [
  { value: "all", label: "全部", description: "浏览商店中的全部主题" },
  { value: "gradient", label: "渐变光影", description: "柔和渐变与抽象光线" },
  { value: "nature", label: "自然景观", description: "海岸、森林与大气景观" },
  { value: "minimal", label: "简约留白", description: "安静、克制的工作空间" },
  { value: "dark", label: "深色沉浸", description: "为夜间创作设计的低亮界面" },
  { value: "editorial", label: "纸张质感", description: "出版物与手工纸张风格" },
] as const satisfies readonly CategoryOption[];

export const PLATFORM_OPTIONS = [
  { value: "all", label: "全部平台" },
  { value: "macos", label: "macOS" },
  { value: "windows", label: "Windows" },
] as const satisfies readonly FilterOption<ThemePlatform | "all">[];

export const COLOR_OPTIONS = [
  { value: "all", label: "全部颜色", swatch: "linear-gradient(135deg, #8b5cf6, #38bdf8, #34d399)" },
  { value: "blue", label: "蓝色", swatch: "#3b82f6" },
  { value: "violet", label: "紫色", swatch: "#8b5cf6" },
  { value: "green", label: "绿色", swatch: "#4d7c5b" },
  { value: "teal", label: "青色", swatch: "#0d9488" },
  { value: "rose", label: "玫瑰", swatch: "#e8798f" },
  { value: "orange", label: "橙色", swatch: "#f97316" },
  { value: "neutral", label: "中性色", swatch: "#a8a29e" },
  { value: "black", label: "黑色", swatch: "#171717" },
] as const satisfies readonly (FilterOption<ThemeColor | "all"> & { readonly swatch: string })[];

export const SORT_OPTIONS = [
  { value: "featured", label: "精选推荐" },
  { value: "popular", label: "下载最多" },
  { value: "newest", label: "最新发布" },
  { value: "rating", label: "评分最高" },
] as const satisfies readonly FilterOption<ThemeSort>[];

export const THEMES: readonly Theme[] = GENERATED_THEMES;

function normalizeSearchValue(value: string): string {
  return value.trim().toLocaleLowerCase("zh-CN");
}

function matchesSearch(theme: Theme, query: string): boolean {
  const normalizedQuery = normalizeSearchValue(query);

  if (!normalizedQuery) {
    return true;
  }

  const searchable = [
    theme.name,
    theme.summary,
    theme.author.name,
    theme.author.handle,
    ...theme.tags,
  ];

  return searchable.some((value) => normalizeSearchValue(value).includes(normalizedQuery));
}

function compareThemes(left: Theme, right: Theme, sort: ThemeSort): number {
  if (sort === "popular") {
    return right.stats.downloads - left.stats.downloads;
  }

  if (sort === "newest") {
    return Date.parse(right.publishedAt) - Date.parse(left.publishedAt);
  }

  if (sort === "rating") {
    return right.stats.rating - left.stats.rating || right.stats.reviews - left.stats.reviews;
  }

  return Number(right.featured) - Number(left.featured)
    || Number(right.isNew) - Number(left.isNew)
    || right.stats.downloads - left.stats.downloads;
}

export function filterThemes(
  themes: readonly Theme[] = THEMES,
  options: ThemeFilterOptions = {},
): Theme[] {
  const {
    query = "",
    category = "all",
    platform = "all",
    color = "all",
    featuredOnly = false,
    sort = "featured",
  } = options;

  return themes
    .filter((theme) => matchesSearch(theme, query))
    .filter((theme) => category === "all" || theme.category === category)
    .filter((theme) => platform === "all" || theme.platforms.includes(platform))
    .filter((theme) => color === "all" || theme.colors.includes(color))
    .filter((theme) => !featuredOnly || theme.featured)
    .sort((left, right) => compareThemes(left, right, sort));
}

export function getThemeBySlug(slug: string): Theme | undefined {
  return THEMES.find((theme) => theme.slug === slug);
}

export function getThemeCategoryLabel(category: ThemeCategory): string {
  return THEME_CATEGORIES.find((option) => option.value === category)?.label ?? category;
}

export function getPlatformLabel(platform: ThemePlatform): string {
  return PLATFORM_OPTIONS.find((option) => option.value === platform)?.label ?? platform;
}

export function formatDownloads(downloads: number, locale = "zh-CN"): string {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: downloads >= 10_000 ? 1 : 0,
  }).format(downloads);
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function getCategoryCount(
  category: ThemeCategory | "all",
  themes: readonly Theme[] = THEMES,
): number {
  return category === "all"
    ? themes.length
    : themes.filter((theme) => theme.category === category).length;
}
