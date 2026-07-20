import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const GENERATED_NEON = process.argv[2];

const themes = [
  {
    slug: "neon-tides", name: "Neon Tides", zh: "霓虹潮汐", category: "dark", manifestCategory: "其他", variant: "dark",
    summary: "深海黑与青粉流光交叠的沉浸主题，为夜间编码保留安静、清晰的视觉中心。",
    colors: ["teal", "rose", "black"], tags: ["原创", "霓虹", "深色", "沉浸", "双平台"],
    accent: "#24d6d1", ink: "#eafcff", surface: "#07111f", muted: "#8da7b5", soft: "#123746", code: "#ff4fa3", border: "#24576a",
    kind: "neon", pattern: "aurora", title: "让灵感顺着光流抵达", subtitle: "深潜、专注，然后把复杂问题带回水面", badge: "NIGHT FLOW", featured: true,
  },
  {
    slug: "paper-crane", name: "Paper Crane", zh: "纸鹤手札", category: "editorial", manifestCategory: "极简", variant: "light",
    summary: "米纸、朱砂与墨色构成的东方编辑风主题，适合写作、阅读与耐心推演。",
    colors: ["neutral", "orange"], tags: ["原创", "纸张", "东方", "编辑风", "双平台"],
    accent: "#c94b32", ink: "#2f2923", surface: "#f4eddc", muted: "#776d61", soft: "#ead9c3", code: "#315f68", border: "#cdbda8",
    kind: "paper", pattern: "paper", title: "把复杂折成清晰的一步", subtitle: "慢一点看，答案会在纸纹里浮现", badge: "NOTES 01", featured: true,
  },
  {
    slug: "moss-library", name: "Moss Library", zh: "苔藓书房", category: "nature", manifestCategory: "风景", variant: "dark",
    summary: "苔绿、旧木与琥珀灯光组成的安静书房，适合长时间阅读代码与梳理知识。",
    colors: ["green", "orange", "black"], tags: ["原创", "苔藓", "书房", "自然", "双平台"],
    accent: "#9fbd76", ink: "#f0f1df", surface: "#16231c", muted: "#9aa995", soft: "#2b4032", code: "#e2b66d", border: "#405546",
    kind: "moss", pattern: "mist", title: "在安静里读懂整个系统", subtitle: "像翻开旧书一样，逐页理解每条依赖", badge: "DEEP READ", featured: false,
  },
  {
    slug: "lunar-terminal", name: "Lunar Terminal", zh: "月面终端", category: "dark", manifestCategory: "游戏", variant: "dark",
    summary: "月面银、深空蓝与冷光网格塑造的工程终端，专为调试、构建与发布节奏设计。",
    colors: ["blue", "neutral", "black"], tags: ["原创", "月面", "终端", "工程感", "双平台"],
    accent: "#7db9ff", ink: "#eef6ff", surface: "#0b1424", muted: "#8fa1b8", soft: "#182b45", code: "#b7c8e8", border: "#29466d",
    kind: "lunar", pattern: "grid", title: "建立坐标，开始下一次探索", subtitle: "把未知拆成信号、轨迹与可靠的着陆点", badge: "LUNAR OPS", featured: true,
  },
  {
    slug: "peach-soda", name: "Peach Soda", zh: "蜜桃汽水", category: "gradient", manifestCategory: "其他", variant: "light",
    summary: "蜜桃粉、薄荷绿与奶油白的轻快主题，让原型、脑暴和小步迭代更有活力。",
    colors: ["rose", "teal", "orange"], tags: ["原创", "蜜桃", "汽水", "轻快", "双平台"],
    accent: "#f06f7f", ink: "#3e3440", surface: "#fff4ed", muted: "#88757c", soft: "#ffd9d0", code: "#20a995", border: "#f1c3b9",
    kind: "peach", pattern: "orb", title: "先冒一个泡泡，再做成真的", subtitle: "轻快试验每个想法，让好点子自然浮上来", badge: "FRESH IDEA", featured: false,
  },
  {
    slug: "mono-focus", name: "Mono Focus", zh: "单色专注", category: "minimal", manifestCategory: "极简", variant: "light",
    summary: "黑白留白中只保留一笔钴蓝，强调层级、键盘效率与无干扰工作。",
    colors: ["neutral", "black", "blue"], tags: ["原创", "黑白", "极简", "专注", "双平台"],
    accent: "#2457ff", ink: "#151515", surface: "#f5f4ef", muted: "#74726c", soft: "#dfe5ff", code: "#2457ff", border: "#c9c7c0",
    kind: "mono", pattern: "grid", title: "只留下推进任务的必要信息", subtitle: "更少噪声，更清楚的下一步", badge: "FOCUS MODE", featured: false,
  },
  {
    slug: "desert-signal", name: "Desert Signal", zh: "沙漠信号", category: "nature", manifestCategory: "风景", variant: "light",
    summary: "沙丘金、陶土橙与绿洲青组成的暖色主题，适合规划路线和持续推进长任务。",
    colors: ["orange", "teal", "neutral"], tags: ["原创", "沙丘", "暖色", "绿洲", "双平台"],
    accent: "#d86f3d", ink: "#3d3028", surface: "#f3dfbd", muted: "#806d5e", soft: "#ead0a4", code: "#147f78", border: "#d5b786",
    kind: "desert", pattern: "horizon", title: "沿着信号，把远方变成路线", subtitle: "确认方向、保存体力，然后稳定抵达", badge: "LONG RUN", featured: false,
  },
  {
    slug: "violet-rain", name: "Violet Rain", zh: "紫雨夜行", category: "dark", manifestCategory: "风景", variant: "dark",
    summary: "深紫雨幕与蓝色路灯交织的夜行主题，为排错和深夜创作提供低亮专注感。",
    colors: ["violet", "blue", "black"], tags: ["原创", "紫雨", "夜行", "低亮", "双平台"],
    accent: "#a98bff", ink: "#f0ecff", surface: "#151126", muted: "#9c94b5", soft: "#2d2449", code: "#67c4ff", border: "#433766",
    kind: "rain", pattern: "stars", title: "在雨声里找到问题的节奏", subtitle: "让每条线索发光，让每次修复落地", badge: "AFTER HOURS", featured: false,
  },
  {
    slug: "glacier-glass", name: "Glacier Glass", zh: "冰川玻璃", category: "gradient", manifestCategory: "风景", variant: "light",
    summary: "冰川蓝、玻璃白与极光青构成的清透主题，适合审查、整理与高密度信息阅读。",
    colors: ["blue", "teal", "neutral"], tags: ["原创", "冰川", "玻璃", "清透", "双平台"],
    accent: "#168fb2", ink: "#173746", surface: "#eaf7fa", muted: "#66818d", soft: "#ccebf2", code: "#5c69d8", border: "#acd3dc",
    kind: "glacier", pattern: "aurora", title: "看清结构，也看见细小裂纹", subtitle: "以冷静视角审查系统，让改动清澈可靠", badge: "CLEAR VIEW", featured: false,
  },
];

await Promise.all(["themes", "catalog/themes", "previews", "public/theme-previews", "backgrounds"].map((dir) => mkdir(join(ROOT, dir), { recursive: true })));

if (GENERATED_NEON) await copyFile(GENERATED_NEON, join(ROOT, "backgrounds/neon-tides.png"));

for (const [index, theme] of themes.entries()) {
  const backgroundPath = join(ROOT, `backgrounds/${theme.slug}.png`);
  if (theme.kind === "neon") {
    const resized = await sharp(backgroundPath).resize(1920, 1080, { fit: "cover" }).png().toBuffer();
    await writeFile(backgroundPath, resized);
  } else {
    await sharp(Buffer.from(backgroundSvg(theme))).png().toFile(backgroundPath);
  }

  const previewPath = join(ROOT, `previews/${theme.slug}.png`);
  const blurredBackground = await sharp(backgroundPath).resize(1600, 1000, { fit: "cover" }).modulate({ brightness: theme.variant === "dark" ? 0.72 : 1.02 }).png().toBuffer();
  await sharp(blurredBackground)
    .composite([{ input: Buffer.from(previewOverlay(theme)), top: 0, left: 0 }])
    .png()
    .toFile(previewPath);
  await copyFile(previewPath, join(ROOT, `public/theme-previews/${theme.slug}.png`));
  await writeFile(join(ROOT, `themes/${theme.slug}.json`), `${JSON.stringify(manifest(theme), null, 2)}\n`);
  await writeFile(join(ROOT, `catalog/themes/${theme.slug}.json`), `${JSON.stringify(catalog(theme, index), null, 2)}\n`);
}

const repositoryPath = join(ROOT, "theme-repository.json");
const repository = JSON.parse(await readFile(repositoryPath, "utf8"));
const existing = new Map(repository.themes.map((item) => [item.id, item]));
for (const theme of themes) existing.set(theme.slug, { id: theme.slug, manifest: `themes/${theme.slug}.json` });
repository.updatedAt = "2026-07-18T12:00:00Z";
repository.themes = [...existing.values()].sort((a, b) => a.id.localeCompare(b.id));
await writeFile(repositoryPath, `${JSON.stringify(repository, null, 2)}\n`);
console.log(`Created ${themes.length} curated themes and their preview assets.`);

function manifest(t) {
  return {
    $schema: "../schemas/theme-v1.schema.json", schemaVersion: 1, version: "1.0.0", displayName: t.name,
    codeThemeId: t.slug, category: t.manifestCategory, description: t.summary.slice(0, 110), author: "Codex Skin", variant: t.variant,
    previewImage: `../previews/${t.slug}.png`,
    theme: {
      accent: t.accent, contrast: t.variant === "dark" ? 68 : 54,
      fonts: { code: "JetBrainsMono NFM", ui: '"Microsoft YaHei UI", "PingFang SC", "Noto Sans SC", "Segoe UI", sans-serif', display: '"Microsoft YaHei UI", "PingFang SC", "Noto Sans SC", "Segoe UI", sans-serif' },
      ink: t.ink, opaqueWindows: false,
      semanticColors: { diffAdded: t.kind === "moss" ? "#9fbd76" : "#38b980", diffRemoved: t.kind === "paper" ? "#c94b32" : "#ef6472", skill: t.code },
      surface: t.surface, backgroundImage: `../backgrounds/${t.slug}.png`, backgroundPosition: "center", visualIntensity: t.variant === "dark" ? "immersive" : "balanced",
      ...(t.kind === "rain" ? { effects: { ambient: "rain", intensity: "subtle" } } : {}),
      backgroundImageOpacity: t.variant === "dark" ? 0.88 : 0.72, backgroundImageBlur: 0,
    },
    home: {
      brand: t.zh, eyebrow: t.name, badge: t.badge, title: t.title, subtitle: t.subtitle,
      tags: ["理解", "构建", "审查", "修复"],
      sidebarLabels: { newTask: "新建任务", scheduled: "任务排期", plugins: "插件", settings: "设置" },
      composerHint: "描述你的目标，我们从最清楚的一步开始…", footerNote: `${t.name} · Codex Skin Original`,
      quickActions: [
        { icon: "⌁", title: "理解代码", description: "梳理结构与关键路径", prompt: "请探索当前代码库，概览结构、关键模块与主要数据流。" },
        { icon: "+", title: "构建功能", description: "把目标变成可靠实现", prompt: "请根据当前项目构建这个功能，并验证核心体验。" },
        { icon: "✓", title: "审查改动", description: "发现风险与遗漏", prompt: "请审查当前改动，优先寻找缺陷、回归风险和缺失测试。" },
        { icon: "!", title: "修复问题", description: "定位根因并完成验证", prompt: "请诊断当前问题，找到根因、完成修复并验证结果。" },
      ],
    },
    copy: { title: `Codex · ${t.zh}`, replacePlaceholders: { "Ask Codex": "Describe the next step...", "Ask Codex anything": "描述你的目标，我们从最清楚的一步开始…", "向 Codex 询问任何问题": "描述你的目标，我们从最清楚的一步开始…", "给 Codex 发送消息": "描述你的目标，我们从最清楚的一步开始…" } },
  };
}

function catalog(t, index) {
  return {
    slug: t.slug, name: t.name, summary: t.summary,
    author: { name: "Codex Skin", handle: "codex-skin", curated: true }, category: t.category,
    platforms: ["macos", "windows"], colors: t.colors, tags: t.tags,
    stats: { downloads: 0, rating: 0, reviews: 0 }, featured: t.featured, isNew: true,
    version: "1.0.0", engineRange: ">=1.0.0 <2.0.0", publishedAt: new Date(Date.UTC(2026, 6, 18, 4, index)).toISOString(),
    license: { name: "Codex-Skin Theme Assets", spdx: "LicenseRef-Codex-Skin-Theme", source: "project-curated-assets" },
    package: null, previewImage: `/theme-previews/${t.slug}.png`,
    previewStyle: { backgroundColor: t.surface, backgroundImage: `linear-gradient(145deg, ${t.surface}, ${t.soft})`, panelColor: t.surface, panelBorder: t.border, textColor: t.ink, mutedTextColor: t.muted, accentColor: t.accent, accentSoft: t.soft, codeColor: t.code, shadow: `0 28px 80px ${t.variant === "dark" ? "rgba(0,0,0,.48)" : "rgba(43,54,67,.18)"}`, pattern: t.pattern },
  };
}

function escapeXml(value) { return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }

function backgroundSvg(t) {
  const bodies = {
    paper: `<rect width="1920" height="1080" fill="#f4eddc"/><circle cx="1570" cy="210" r="230" fill="#c94b32" opacity=".88"/><path d="M0 830 Q420 650 820 820 T1920 720 V1080 H0Z" fill="#d8c5a8" opacity=".7"/><g stroke="#6d665b" opacity=".25">${Array.from({length:18},(_,i)=>`<path d="M0 ${i*64} Q650 ${i*50+80} 1920 ${i*62}"/>`).join("")}</g>`,
    moss: `<defs><radialGradient id="g"><stop stop-color="#607c50"/><stop offset="1" stop-color="#101b16"/></radialGradient></defs><rect width="1920" height="1080" fill="url(#g)"/><g fill="none" stroke="#9fbd76" opacity=".18" stroke-width="3">${[220,340,480,650,830].map(r=>`<circle cx="1550" cy="620" r="${r}"/>`).join("")}</g><g fill="#e2b66d" opacity=".12">${Array.from({length:22},(_,i)=>`<circle cx="${90+i*83}" cy="${150+(i%5)*170}" r="${16+(i%4)*8}"/>`).join("")}</g>`,
    lunar: `<defs><radialGradient id="m"><stop stop-color="#d7e5f6"/><stop offset="1" stop-color="#7186a0"/></radialGradient></defs><rect width="1920" height="1080" fill="#081321"/><g stroke="#7db9ff" opacity=".12">${Array.from({length:17},(_,i)=>`<path d="M0 ${i*68}H1920M${i*120} 0V1080"/>`).join("")}</g><circle cx="1520" cy="260" r="190" fill="url(#m)"/><path d="M0 900 Q600 690 1100 850 T1920 760 V1080 H0Z" fill="#17263a"/><g fill="#d7e5f6">${Array.from({length:36},(_,i)=>`<circle cx="${(i*227)%1880}" cy="${(i*137)%650}" r="${i%3+1}"/>`).join("")}</g>`,
    peach: `<defs><linearGradient id="p" x2="1" y2="1"><stop stop-color="#fff4ed"/><stop offset=".55" stop-color="#ffd4ca"/><stop offset="1" stop-color="#c8f0e5"/></linearGradient></defs><rect width="1920" height="1080" fill="url(#p)"/><circle cx="1580" cy="240" r="270" fill="#f06f7f" opacity=".36"/><circle cx="320" cy="860" r="360" fill="#20a995" opacity=".22"/><g fill="none" stroke="#fff" stroke-width="6" opacity=".55">${Array.from({length:18},(_,i)=>`<circle cx="${100+(i*131)%1750}" cy="${80+(i*173)%900}" r="${18+(i%5)*11}"/>`).join("")}</g>`,
    mono: `<rect width="1920" height="1080" fill="#f5f4ef"/><g stroke="#151515" opacity=".09">${Array.from({length:20},(_,i)=>`<path d="M0 ${i*60}H1920M${i*100} 0V1080"/>`).join("")}</g><rect x="1380" y="0" width="540" height="1080" fill="#151515"/><circle cx="1380" cy="540" r="260" fill="#2457ff"/><rect x="120" y="160" width="14" height="760" fill="#151515"/>`,
    desert: `<defs><linearGradient id="d" y2="1"><stop stop-color="#f6e7ca"/><stop offset="1" stop-color="#d9a965"/></linearGradient></defs><rect width="1920" height="1080" fill="url(#d)"/><circle cx="1530" cy="250" r="190" fill="#d86f3d"/><path d="M0 720 Q450 560 900 760 T1920 640 V1080 H0Z" fill="#c98c50"/><path d="M0 850 Q520 650 1000 850 T1920 760 V1080 H0Z" fill="#8d5b39" opacity=".65"/><path d="M0 960 Q530 800 1050 930 T1920 850" fill="none" stroke="#147f78" stroke-width="34" opacity=".75"/>`,
    rain: `<defs><radialGradient id="r" cx="75%" cy="30%"><stop stop-color="#513c87"/><stop offset="1" stop-color="#100c20"/></radialGradient></defs><rect width="1920" height="1080" fill="url(#r)"/><circle cx="1450" cy="260" r="210" fill="#67c4ff" opacity=".2"/><g stroke="#a98bff" opacity=".28" stroke-width="3">${Array.from({length:48},(_,i)=>`<path d="M${i*48-220} 0L${i*48-520} 1080"/>`).join("")}</g><path d="M0 910 Q520 790 980 900 T1920 820 V1080 H0Z" fill="#0b0915" opacity=".82"/>`,
    glacier: `<defs><linearGradient id="i" x2="1" y2="1"><stop stop-color="#f5fdff"/><stop offset=".55" stop-color="#bfe6ed"/><stop offset="1" stop-color="#7bc8d8"/></linearGradient></defs><rect width="1920" height="1080" fill="url(#i)"/><g fill="#fff" stroke="#168fb2" stroke-opacity=".18"> <path d="M1150 0L1920 0V760L1480 620Z" opacity=".6"/><path d="M780 1080L1190 210L1500 1080Z" opacity=".38"/><path d="M0 760L650 280L910 1080H0Z" opacity=".5"/></g><g fill="none" stroke="#5c69d8" opacity=".2" stroke-width="4"><path d="M300 0L760 1080M980 0L1180 1080M1500 0L1380 1080"/></g>`,
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">${bodies[t.kind]}</svg>`;
}

function previewOverlay(t) {
  const dark = t.variant === "dark";
  const panel = dark ? `${t.surface}e8` : `${t.surface}ed`;
  const card = dark ? `${t.soft}df` : "#ffffffd9";
  const titles = ["理解代码", "构建功能", "审查改动", "修复问题"];
  const descs = ["梳理结构与关键路径", "把目标变成可靠实现", "发现风险与遗漏", "定位根因并完成验证"];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000">
    <rect x="48" y="42" width="1504" height="916" rx="28" fill="${panel}" stroke="${t.border}" stroke-width="2"/>
    <rect x="48" y="42" width="274" height="916" rx="28" fill="${t.surface}" opacity=".92"/><path d="M322 42V958" stroke="${t.border}"/>
    <circle cx="92" cy="83" r="7" fill="#ff6b65"/><circle cx="116" cy="83" r="7" fill="#f4bf4f"/><circle cx="140" cy="83" r="7" fill="#63c174"/>
    <text x="82" y="153" fill="${t.accent}" font-size="19" font-family="Arial" font-weight="700">${escapeXml(t.name.toUpperCase())}</text>
    ${["＋  新建任务", "◷  任务排期", "◇  插件", "⚙  设置"].map((label,i)=>`<rect x="72" y="${198+i*62}" width="226" height="46" rx="12" fill="${i===0?t.soft:"transparent"}"/><text x="92" y="${228+i*62}" fill="${i===0?t.ink:t.muted}" font-size="17" font-family="Microsoft YaHei, Arial">${label}</text>`).join("")}
    <rect x="72" y="842" width="226" height="78" rx="16" fill="${t.soft}"/><circle cx="108" cy="881" r="18" fill="${t.accent}"/><text x="139" y="878" fill="${t.ink}" font-size="15" font-family="Arial" font-weight="700">CODEX SKIN</text><text x="139" y="899" fill="${t.muted}" font-size="13" font-family="Arial">ORIGINAL THEME</text>
    <rect x="364" y="78" width="150" height="34" rx="17" fill="${t.soft}"/><text x="439" y="100" text-anchor="middle" fill="${t.accent}" font-size="13" font-family="Arial" font-weight="700">${escapeXml(t.badge)}</text>
    <text x="364" y="180" fill="${t.ink}" font-size="48" font-family="Microsoft YaHei, Arial" font-weight="700">${escapeXml(t.title)}</text>
    <text x="364" y="224" fill="${t.muted}" font-size="20" font-family="Microsoft YaHei, Arial">${escapeXml(t.subtitle)}</text>
    ${titles.map((title,i)=>{const x=364+(i%2)*566,y=294+Math.floor(i/2)*180;return `<rect x="${x}" y="${y}" width="530" height="148" rx="20" fill="${card}" stroke="${t.border}"/><circle cx="${x+48}" cy="${y+45}" r="22" fill="${t.soft}"/><text x="${x+48}" y="${y+52}" text-anchor="middle" fill="${t.accent}" font-size="22" font-family="Arial" font-weight="700">${["⌁","+","✓","!"][i]}</text><text x="${x+86}" y="${y+50}" fill="${t.ink}" font-size="22" font-family="Microsoft YaHei, Arial" font-weight="700">${title}</text><text x="${x+34}" y="${y+98}" fill="${t.muted}" font-size="16" font-family="Microsoft YaHei, Arial">${descs[i]}</text><text x="${x+482}" y="${y+102}" fill="${t.accent}" font-size="23" font-family="Arial">↗</text>`;}).join("")}
    <rect x="364" y="688" width="1096" height="126" rx="24" fill="${card}" stroke="${t.border}" stroke-width="2"/><text x="402" y="750" fill="${t.muted}" font-size="18" font-family="Microsoft YaHei, Arial">描述你的目标，我们从最清楚的一步开始…</text><rect x="1368" y="726" width="56" height="56" rx="18" fill="${t.accent}"/><text x="1396" y="762" text-anchor="middle" fill="${dark?"#07111f":"#fff"}" font-size="26" font-family="Arial">↑</text>
    <text x="912" y="875" text-anchor="middle" fill="${t.muted}" font-size="14" font-family="Arial">${escapeXml(t.name)} · Codex Skin Original</text>
  </svg>`;
}
