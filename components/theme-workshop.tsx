"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  CATEGORY_OPTIONS,
  DEFAULT_SUBMISSION,
  createSubmissionArchive,
  type SubmissionDraft,
  validateSubmission,
  validateSubmissionAssets,
} from "@/lib/theme-submission";

const DRAFT_KEY = "codex-skin-theme-workshop-v1";

function FileField({ label, hint, accept, file, onChange }: { label: string; hint: string; accept: string; file?: File; onChange: (file?: File) => void }) {
  return (
    <label className="workshop-file">
      <span>{label}</span>
      <small>{file ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB` : hint}</small>
      <input type="file" accept={accept} onChange={(event) => onChange(event.target.files?.[0])} />
      <b>{file ? "更换图片" : "选择图片"}</b>
    </label>
  );
}

function TextField({ label, value, onChange, maxLength, hint }: { label: string; value: string; onChange: (value: string) => void; maxLength?: number; hint?: string }) {
  return (
    <label className="workshop-field">
      <span>{label}</span>
      <input value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} />
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function ThemeWorkshop() {
  const [draft, setDraft] = useState<SubmissionDraft>(DEFAULT_SUBMISSION);
  const [preview, setPreview] = useState<File>();
  const [background, setBackground] = useState<File>();
  const [submitted, setSubmitted] = useState(false);
  const [ready, setReady] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [archiveError, setArchiveError] = useState("");
  const [assetErrors, setAssetErrors] = useState<string[]>([]);
  const [checkingAssets, setCheckingAssets] = useState(false);
  const assetCheckId = useRef(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) setDraft({ ...DEFAULT_SUBMISSION, ...JSON.parse(saved) });
      } catch { /* Ignore an invalid local draft. */ }
      setReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [draft, ready]);

  const backgroundUrl = useMemo(() => background ? URL.createObjectURL(background) : undefined, [background]);
  useEffect(() => () => { if (backgroundUrl) URL.revokeObjectURL(backgroundUrl); }, [backgroundUrl]);
  async function checkAssets(nextPreview?: File, nextBackground?: File) {
    const checkId = ++assetCheckId.current;
    setCheckingAssets(true);
    const nextErrors = await validateSubmissionAssets(nextPreview, nextBackground);
    if (checkId === assetCheckId.current) {
      setAssetErrors(nextErrors);
      setCheckingAssets(false);
    }
  }
  const selectPreview = (file?: File) => { setPreview(file); void checkAssets(file, background); };
  const selectBackground = (file?: File) => { setBackground(file); void checkAssets(preview, file); };
  const formErrors = validateSubmission(draft, preview);
  const errors = [...formErrors, ...assetErrors];
  const set = <K extends keyof SubmissionDraft>(key: K, value: SubmissionDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));

  async function download() {
    setSubmitted(true);
    if (!preview || formErrors.length) return;
    setGenerating(true);
    setArchiveError("");
    try {
      const latestAssetErrors = await validateSubmissionAssets(preview, background);
      setAssetErrors(latestAssetErrors);
      if (latestAssetErrors.length) return;
      const blob = await createSubmissionArchive(draft, preview, background);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `codex-skin-submission-${draft.slug}-1.0.0.zip`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setArchiveError("投稿包生成失败，请重新选择图片后再试一次。");
    } finally {
      setGenerating(false);
    }
  }

  const issueUrl = `https://github.com/lixiaobaivv/Codex-Skin-Store/issues/new?template=theme-submission.yml&title=${encodeURIComponent(`[Theme]: ${draft.slug}`)}`;
  const previewStyle = {
    "--workshop-accent": draft.accent,
    "--workshop-ink": draft.ink,
    "--workshop-surface": draft.surface,
    "--workshop-background": backgroundUrl ? `url(${backgroundUrl})` : "none",
    "--workshop-background-size": "contain",
    "--workshop-background-position": draft.backgroundPosition,
  } as CSSProperties;

  return (
    <main className="workshop-page">
      <header className="workshop-header">
        <Link className="brand" href="/">CODEX<span>·</span>SKIN</Link>
        <div><span>主题工坊</span><Link href="/">返回商店</Link></div>
      </header>

      <section className="workshop-intro">
        <p>THEME WORKSHOP · V1</p>
        <h1>不用写代码，<br />做完就能投稿。</h1>
        <span>填写基础信息、调整颜色并上传真实截图。工坊会生成符合 Store 目录结构的标准投稿包。</span>
      </section>

      <div className="workshop-layout">
        <section className="workshop-form" aria-label="主题投稿表单">
          <div className="workshop-section-title"><b>01</b><div><h2>作品信息</h2><p>主题 ID 发布后不可修改，建议使用英文名称。</p></div></div>
          <div className="workshop-fields workshop-fields--two">
            <TextField label="主题名称" value={draft.name} maxLength={60} onChange={(value) => set("name", value)} />
            <TextField label="主题 ID" value={draft.slug} maxLength={64} hint="例如：ocean-night" onChange={(value) => set("slug", value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} />
            <TextField label="作者名称" value={draft.author} maxLength={60} onChange={(value) => set("author", value)} />
            <TextField label="GitHub 用户名" value={draft.handle} maxLength={39} onChange={(value) => set("handle", value)} />
          </div>
          <label className="workshop-field"><span>一句话简介</span><textarea value={draft.summary} maxLength={120} onChange={(event) => set("summary", event.target.value)} /></label>
          <div className="workshop-fields workshop-fields--two">
            <label className="workshop-field"><span>分类</span><select value={draft.category} onChange={(event) => set("category", event.target.value as SubmissionDraft["category"])}>{CATEGORY_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label className="workshop-field"><span>明暗模式</span><select value={draft.variant} onChange={(event) => set("variant", event.target.value as SubmissionDraft["variant"])}><option value="light">浅色</option><option value="dark">深色</option></select></label>
          </div>

          <div className="workshop-section-title"><b>02</b><div><h2>视觉与首页</h2><p>右侧预览会跟随修改即时更新。</p></div></div>
          <div className="workshop-colors">
            {(["accent", "ink", "surface"] as const).map((key) => <label key={key}><span>{{ accent: "强调色", ink: "文字色", surface: "界面底色" }[key]}</span><input type="color" value={draft[key]} onChange={(event) => set(key, event.target.value)} /><code>{draft[key]}</code></label>)}
          </div>
          <div className="workshop-fields workshop-fields--two">
            <TextField label="品牌文字" value={draft.brand} maxLength={40} onChange={(value) => set("brand", value)} />
            <TextField label="首页标题" value={draft.title} maxLength={200} onChange={(value) => set("title", value)} />
          </div>
          <TextField label="首页副标题" value={draft.subtitle} maxLength={200} onChange={(value) => set("subtitle", value)} />
          <TextField label="输入框提示" value={draft.composerHint} maxLength={200} onChange={(value) => set("composerHint", value)} />
          <div className="workshop-files">
            <FileField label="真实效果预览 PNG（必填）" hint="至少 1200×750，建议 1600×1000；最大 2 MB" accept="image/png" file={preview} onChange={selectPreview} />
            <FileField label="主题背景（可选）" hint="PNG / JPEG；最长边 ≤8192；最大 16 MB" accept="image/png,image/jpeg" file={background} onChange={selectBackground} />
          </div>
          {background && <div className="workshop-background-controls">
            <label className="workshop-field"><span>主体焦点</span><select value={draft.backgroundPosition} onChange={(event) => set("backgroundPosition", event.target.value as SubmissionDraft["backgroundPosition"])}><option value="center">居中</option><option value="center top">顶部居中</option><option value="center 20%">上方 20%</option><option value="center 30%">上方 30%</option><option value="center 40%">上方 40%</option><option value="center bottom">底部居中</option><option value="left center">左侧居中</option><option value="right center">右侧居中</option></select><small>背景适配由 Codex-Skin 自动处理；人物头部靠近上缘时建议选择“顶部居中”。</small></label>
          </div>}

          <div className="workshop-section-title"><b>03</b><div><h2>许可与投稿</h2><p>请确认你拥有主题和图片的投稿、展示及再分发权。</p></div></div>
          <label className="workshop-field"><span>素材来源与许可</span><textarea value={draft.licenseNotes} maxLength={1000} placeholder="例如：主题和背景图均为本人原创，作者为……；或列出素材来源链接、作者及 CC BY 4.0 等再分发许可。" onChange={(event) => set("licenseNotes", event.target.value)} /><small>这段说明会进入审核记录；请逐项说明原创、授权或具体许可证，不能只写“网络素材”。</small></label>
          {(submitted ? errors : assetErrors).length > 0 && <div className="workshop-errors" role="alert"><strong>还差一点：</strong><ul>{(submitted ? errors : assetErrors).map((error) => <li key={error}>{error}</li>)}</ul></div>}
          {archiveError && <div className="workshop-errors" role="alert">{archiveError}</div>}
          <div className="workshop-submit">
            <button type="button" onClick={download} disabled={generating || checkingAssets}>{checkingAssets ? "正在检查图片…" : generating ? "正在生成…" : "生成标准投稿包"} <span>↓</span></button>
            <a href={issueUrl} target="_blank" rel="noreferrer">打开投稿页 <span>↗</span></a>
          </div>
          <p className="workshop-submit-hint">先下载投稿包，再打开投稿页并将 ZIP 拖入“投稿包”区域。维护者审核后，CI 会负责验证、构建和签名。</p>
        </section>

        <aside className="workshop-preview-column">
          <div className="workshop-preview-sticky">
            <div className="workshop-preview-heading"><span>实时预览</span><small>自动保存草稿</small></div>
            <div className={`workshop-app-preview workshop-app-preview--${draft.variant}`} style={previewStyle}>
              <div className="workshop-app-sidebar"><strong>{draft.brand || "THEME"}</strong><button>＋ 新建任务</button><span>⌘ 已安排</span><span>◇ 插件</span><span className="workshop-app-bottom">⚙ 设置</span></div>
              <div className="workshop-app-main"><p>CODEX COMMUNITY THEME</p><h2>{draft.title || "首页标题"}</h2><em>{draft.subtitle || "首页副标题"}</em><div className="workshop-app-cards"><span>理解代码<small>梳理结构和关键流程</small></span><span>构建功能<small>实现可运行的新能力</small></span><span>审查代码<small>查找缺陷和回归风险</small></span><span>修复问题<small>定位根因并验证修复</small></span></div><div className="workshop-app-composer">{draft.composerHint || "向 Codex 说明你想完成的工作"}<b>↑</b></div></div>
            </div>
            <div className="workshop-safety"><b>安全构建</b><p>投稿包只包含声明式 JSON 和图片，不接受脚本、HTML、CSS 或可执行文件。</p></div>
          </div>
        </aside>
      </div>
    </main>
  );
}
