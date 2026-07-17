"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createDreamSkinInstallLink } from "@/lib/dreamskin-link";
import {
  COLOR_OPTIONS,
  PLATFORM_OPTIONS,
  SORT_OPTIONS,
  THEME_CATEGORIES,
  THEMES,
  filterThemes,
  formatDownloads,
  formatRating,
  getCategoryCount,
  getPlatformLabel,
  type Theme,
  type ThemeCategory,
  type ThemeColor,
  type ThemePlatform,
  type ThemeSort,
} from "@/lib/themes";

const PROTOCOL_SPEC_URL =
  "https://github.com/lixiaobaivv/Codex-Skin-Store/blob/main/spec/import-protocol.md";

type PreviewVariables = CSSProperties & {
  "--theme-background": string;
  "--theme-background-color": string;
  "--theme-panel": string;
  "--theme-border": string;
  "--theme-text": string;
  "--theme-muted": string;
  "--theme-accent": string;
  "--theme-accent-soft": string;
  "--theme-code": string;
  "--theme-shadow": string;
};

function previewVariables(theme: Theme): PreviewVariables {
  const style = theme.previewStyle;

  return {
    "--theme-background": style.backgroundImage,
    "--theme-background-color": style.backgroundColor,
    "--theme-panel": style.panelColor,
    "--theme-border": style.panelBorder,
    "--theme-text": style.textColor,
    "--theme-muted": style.mutedTextColor,
    "--theme-accent": style.accentColor,
    "--theme-accent-soft": style.accentSoft,
    "--theme-code": style.codeColor,
    "--theme-shadow": style.shadow,
  };
}

function ThemePreview({
  theme,
  compact = false,
}: {
  theme: Theme;
  compact?: boolean;
}) {
  const previewImage = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${theme.previewImage}`;
  return (
    <div
      className={`theme-preview theme-preview--${theme.previewStyle.pattern}${compact ? " theme-preview--compact" : ""}`}
      style={previewVariables(theme)}
      aria-label={`${theme.name} 主题界面预览`}
      role="img"
    >
      <Image className="theme-preview-image" src={previewImage} alt="" width={1586} height={992} unoptimized />
    </div>
  );
}

function CuratedMark() {
  return (
    <span className="curated-mark" title="编辑推荐创作者" aria-label="编辑推荐创作者">
      ✦
    </span>
  );
}

function ThemeCard({
  theme,
  favorite,
  onFavorite,
  onOpen,
}: {
  theme: Theme;
  favorite: boolean;
  onFavorite: () => void;
  onOpen: () => void;
}) {
  return (
    <article className="theme-card" data-theme-slug={theme.slug}>
      <button className="theme-card-preview" type="button" onClick={onOpen}>
        <ThemePreview theme={theme} compact />
        <span className="theme-card-badges">
          {theme.featured && <span className="badge badge--featured">精选</span>}
          {theme.isNew && <span className="badge badge--new">NEW</span>}
        </span>
        <span className="preview-action">查看主题 <b>↗</b></span>
      </button>
      <div className="theme-card-body">
        <div className="theme-card-heading">
          <div>
            <h3>{theme.name}</h3>
            <p>
              @{theme.author.handle} {theme.author.curated && <CuratedMark />}
            </p>
          </div>
          <button
            type="button"
            className={`favorite-button${favorite ? " is-favorite" : ""}`}
            onClick={onFavorite}
            aria-pressed={favorite}
            aria-label={favorite ? `取消收藏 ${theme.name}` : `收藏 ${theme.name}`}
          >
            {favorite ? "♥" : "♡"}
          </button>
        </div>
        <p className="theme-summary">{theme.summary}</p>
        <div className="theme-card-meta">
          <span>↓ {formatDownloads(theme.stats.downloads)}</span>
          <span>★ {formatRating(theme.stats.rating)}</span>
          <span>{theme.platforms.map(getPlatformLabel).join(" · ")}</span>
        </div>
      </div>
    </article>
  );
}

function ThemeDetail({ theme, onClose }: { theme: Theme; onClose: () => void }) {
  const installLink = theme.package?.published ? createDreamSkinInstallLink(theme.package) : undefined;
  return (
    <div className="theme-dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="theme-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="theme-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="dialog-close" type="button" onClick={onClose} aria-label="关闭主题详情">
          ×
        </button>
        <div className="dialog-preview-wrap">
          <ThemePreview theme={theme} />
        </div>
        <div className="dialog-content">
          <div className="dialog-eyebrow">
            <span>{theme.featured ? "编辑精选" : "社区主题"}</span>
            <span>v{theme.version}</span>
          </div>
          <h2 id="theme-dialog-title">{theme.name}</h2>
          <p className="dialog-author">
            by {theme.author.name} · @{theme.author.handle} {theme.author.curated && <CuratedMark />}
          </p>
          <p className="dialog-summary">{theme.summary}</p>
          <div className="dialog-stats">
            <div>
              <strong>{formatDownloads(theme.stats.downloads)}</strong>
              <span>下载</span>
            </div>
            <div>
              <strong>{formatRating(theme.stats.rating)}</strong>
              <span>{theme.stats.reviews} 条评价</span>
            </div>
            <div>
              <strong>
                {theme.platforms.length === 2
                  ? "双平台"
                  : theme.platforms[0]
                    ? getPlatformLabel(theme.platforms[0])
                    : "待确认"}
              </strong>
              <span>兼容平台</span>
            </div>
          </div>
          <div className="dialog-tags">
            {theme.tags.map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
          <div className="compatibility-note">
            <span>安全校验</span>
            <p>声明式主题 · {theme.license.name} · 引擎 {theme.engineRange}</p>
          </div>
          <div className="dialog-actions">
            {installLink ? (
              <a className="primary-button primary-button--wide" href={installLink}>
                一键导入 <span>↗</span>
              </a>
            ) : (
              <button className="primary-button primary-button--wide" type="button" disabled>
                暂无可验证包
              </button>
            )}
            {theme.package?.published && (
              <a className="icon-button" href={theme.package.url}>
                手动下载
              </a>
            )}
            <a className="icon-button" href={PROTOCOL_SPEC_URL} target="_blank" rel="noreferrer">
              查看协议规范
            </a>
          </div>
          <p className="dialog-helper">
            {theme.package?.published
              ? `客户端将校验 ${theme.package.size.toLocaleString("zh-CN")} 字节、SHA-256 与 Ed25519 签名；安装后仍需单独确认应用。`
              : theme.package
                ? "正式主题包已经准备完成，GitHub Release 发布后即可开放一键导入。"
                : "该预览还没有经过签名和发布，因此不提供导入链接。"}
          </p>
        </div>
      </section>
    </div>
  );
}

export function Storefront() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ThemeCategory | "all">("all");
  const [platform, setPlatform] = useState<ThemePlatform | "all">("all");
  const [color, setColor] = useState<ThemeColor | "all">("all");
  const [sort, setSort] = useState<ThemeSort>("featured");
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const featuredTheme = THEMES.find((theme) => theme.featured) ?? THEMES[0];
  const results = useMemo(
    () => filterThemes(THEMES, { query, category, platform, color, sort }),
    [category, color, platform, query, sort],
  );

  useEffect(() => {
    if (!selectedTheme) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedTheme(null);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedTheme]);

  function toggleFavorite(slug: string) {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  }

  function resetFilters() {
    setQuery("");
    setCategory("all");
    setPlatform("all");
    setColor("all");
    setSort("featured");
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Codex-Skin-Store 首页">
          <span className="brand-mark"><i />DS</span>
          <span>Codex-Skin-<b>Store</b></span>
        </a>
        <nav className="site-nav" aria-label="主导航">
          <a href="#discover">发现主题</a>
          <a href="#how-it-works">如何导入</a>
          <a href="#creators">创作者</a>
          <Link href="/submit/">主题工坊</Link>
        </nav>
        <a
          className="header-github"
          href="https://github.com/lixiaobaivv/Codex-Skin-Store"
          target="_blank"
          rel="noreferrer"
        >
          GitHub <span>↗</span>
        </a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="section-label"><span>01</span> THEME MARKETPLACE</p>
          <h1>给 Codex<br />换一种<span>心情。</span></h1>
          <p className="hero-lede">
            精选社区创作的安全主题。先预览，再由本地客户端完成校验、安装与应用确认。
          </p>
          <label className="hero-search">
            <span aria-hidden="true">⌕</span>
            <span className="sr-only">搜索主题</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索风格、颜色或创作者"
              type="search"
            />
            <kbd>⌘ K</kbd>
          </label>
          <div className="hero-notes">
            <span>✓ 声明式安全主题</span>
            <span>✓ 不修改官方应用</span>
            <span>✓ 随时恢复</span>
          </div>
        </div>
        <div className="hero-feature">
          <div className="hero-feature-topline">
            <span>本周精选</span>
            <button type="button" onClick={() => setSelectedTheme(featuredTheme)}>查看详情 ↗</button>
          </div>
          <button
            className="hero-preview-button"
            type="button"
            onClick={() => setSelectedTheme(featuredTheme)}
          >
            <ThemePreview theme={featuredTheme} />
          </button>
          <div className="hero-feature-caption">
            <div>
              <span>FEATURED / 001</span>
              <h2>{featuredTheme.name}</h2>
            </div>
            <p>{featuredTheme.summary}</p>
          </div>
        </div>
      </section>

      <section className="store-stats" aria-label="商店概览">
        <div><strong>{THEMES.length}</strong><span>首发主题</span></div>
        <div><strong>100%</strong><span>声明式资源</span></div>
        <div><strong>2</strong><span>目标桌面平台</span></div>
        <div><strong>OPEN</strong><span>创作者友好</span></div>
      </section>

      <section className="catalog" id="discover">
        <div className="catalog-heading">
          <div>
            <p className="section-label"><span>02</span> DISCOVER</p>
            <h2>找到你的工作台</h2>
          </div>
          <p>每一套主题只包含经过限制的颜色、文案和本地图片资源，不执行第三方脚本。</p>
        </div>

        <div className="catalog-controls">
          <div className="category-tabs" role="tablist" aria-label="主题分类">
            {THEME_CATEGORIES.map((option) => (
              <button
                key={option.value}
                type="button"
                role="tab"
                aria-selected={category === option.value}
                className={category === option.value ? "is-active" : ""}
                onClick={() => setCategory(option.value)}
              >
                {option.label}<sup>{getCategoryCount(option.value)}</sup>
              </button>
            ))}
          </div>
          <div className="select-row">
            <label>
              <span className="sr-only">筛选平台</span>
              <select value={platform} onChange={(event) => setPlatform(event.target.value as ThemePlatform | "all")}>
                {PLATFORM_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label>
              <span className="sr-only">筛选颜色</span>
              <select value={color} onChange={(event) => setColor(event.target.value as ThemeColor | "all")}>
                {COLOR_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label>
              <span className="sr-only">主题排序</span>
              <select value={sort} onChange={(event) => setSort(event.target.value as ThemeSort)}>
                {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>
        </div>

        <div className="result-line">
          <p>显示 <strong>{results.length}</strong> 套主题</p>
          {(query || category !== "all" || platform !== "all" || color !== "all") && (
            <button type="button" onClick={resetFilters}>清除筛选 ×</button>
          )}
        </div>

        {results.length > 0 ? (
          <div className="theme-grid">
            {results.map((theme) => (
              <ThemeCard
                key={theme.slug}
                theme={theme}
                favorite={favorites.has(theme.slug)}
                onFavorite={() => toggleFavorite(theme.slug)}
                onOpen={() => setSelectedTheme(theme)}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span>⌕</span>
            <h3>没有找到相符主题</h3>
            <p>换个关键词，或者清除筛选条件再看看。</p>
            <button type="button" onClick={resetFilters}>查看全部主题</button>
          </div>
        )}
      </section>

      <section className="how-it-works" id="how-it-works">
        <div className="how-heading">
          <p className="section-label section-label--light"><span>03</span> ONE-CLICK IMPORT</p>
          <h2>从心动到生效，<br />始终由你确认。</h2>
        </div>
        <ol className="steps">
          <li>
            <span>01</span>
            <div><strong>挑选主题</strong><p>浏览真实界面预览，确认平台与引擎兼容范围。</p></div>
          </li>
          <li>
            <span>02</span>
            <div><strong>安全校验</strong><p>客户端核对清单、大小、哈希与签名，不运行主题脚本。</p></div>
          </li>
          <li>
            <span>03</span>
            <div><strong>确认安装与应用</strong><p>客户端确认来源并原子安装，成功后再次询问是否热切换。</p></div>
          </li>
        </ol>
        <div className="protocol-chip">
          <span>PROTOCOL</span>
          <code>dreamskin://install?url=…&amp;sha256=…&amp;size=…</code>
          <i>首个双平台签名示例已开放</i>
        </div>
      </section>

      <section className="creator-callout" id="creators">
        <div className="creator-orbit" aria-hidden="true"><i /><i /><i /></div>
        <div>
          <p className="section-label"><span>04</span> FOR CREATORS</p>
          <h2>你的想象，<br />下一位用户的桌面。</h2>
        </div>
        <div className="creator-copy">
          <p>不需要 Fork 仓库或手写 JSON。在主题工坊里调整颜色、实时预览并生成标准投稿包。</p>
          <Link
            className="primary-button"
            href="/submit/"
          >
            打开主题工坊 <span>↗</span>
          </Link>
        </div>
      </section>

      <footer>
        <a className="brand brand--footer" href="#top">
          <span className="brand-mark"><i />DS</span>
          <span>Codex-Skin-<b>Store</b></span>
        </a>
        <p>社区驱动的 Codex 主题商店 · 非 OpenAI 官方产品</p>
        <div>
          <a href="https://github.com/lixiaobaivv/Codex-Skin-Store" target="_blank" rel="noreferrer">GitHub</a>
          <a href="https://github.com/Fei-Away/Codex-Dream-Skin" target="_blank" rel="noreferrer">Theme Engine</a>
        </div>
      </footer>

      {selectedTheme && <ThemeDetail theme={selectedTheme} onClose={() => setSelectedTheme(null)} />}
    </main>
  );
}
