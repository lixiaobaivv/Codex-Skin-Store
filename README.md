# Codex-Skin-Store

**Codex-Skin-Store** 是面向 Codex-Skin 客户端的开源主题目录与分发页面。它负责主题浏览、静态目录、版本元数据和一键导入入口；主题的下载校验、签名验证、安装、应用与恢复由用户本机客户端完成。

- 在线商店：<https://lixiaobaivv.github.io/Codex-Skin-Store/>
- 客户端项目：[Codex-Skin](https://github.com/lixiaobaivv/Codex-Skin)
- 主题投稿：[主题投稿指南](docs/theme-submission.md)
- 协议说明：[导入协议](spec/import-protocol.md)
- 安全设计：[架构文档](docs/architecture.md)

> [!IMPORTANT]
> Codex-Skin-Store 是社区开源项目，不是 OpenAI 或 Codex 官方产品，也不是 Codex 官方插件。项目不会收集 Codex 凭证、API Key、项目内容或本机 CDP 数据。

## 当前能力

当前版本已经具备：

- 基于 GitHub Pages 的公开静态主题商店；
- 主题搜索、分类、平台、颜色和排序筛选；
- 主题详情、兼容平台、版本、许可和安全信息展示；
- 已签名 `.dreamskin` 包的手动下载与 `dreamskin://install` 一键导入；
- 一个经过真实发布元数据验证的双平台签名示例；
- 一个主题一个 JSON 文件的版本化静态目录；
- 封闭的目录 Schema、重复项检查和确定性代码生成；
- GitHub Issue/PR 投稿模板与 Actions 自动预检；
- 维护者审核、合并后自动更新 GitHub Pages 的发布流程。

目录目前包含 9 个可真实下载和验证的签名主题。其中首个端到端样例位于 `sample-v1` Release，另外 8 个程序化主题位于 `catalog-v1` Release；它们都具备真实包文件、精确字节数、SHA-256 和 Ed25519 签名，可以通过一键导入或手动下载进入客户端验证流程。

## 为什么不需要服务器

Codex-Skin-Store 当前完全依赖 GitHub 提供的开源协作和静态托管能力：

```text
创作者 GitHub 身份
        │
        ▼
Pull Request ──> GitHub Actions 自动预检 ──> 维护者审核
                                                    │
                                                    ▼
GitHub Release <── 包地址与摘要 ── 静态主题目录 ──> GitHub Pages
       │                                             │
       └────────── HTTPS / dreamskin:// ─────────────┘
                              │
                              ▼
                    用户本机 Codex-Skin 客户端
                  下载 → 校验 → 确认安装 → 确认应用
```

因此当前不需要承担以下成本：

- 应用服务器；
- 自有账号系统；
- 数据库；
- 对象存储；
- 在线上传后台；
- 常驻审核服务。

只有当未来投稿量和社区功能确实需要在线写入时，才会重新评估账号、上传、审核队列和对象存储。

## 使用主题

1. 打开 [Codex-Skin-Store](https://lixiaobaivv.github.io/Codex-Skin-Store/)；
2. 选择带有“可导入”状态的已发布主题；
3. 点击“一键导入”，或下载 `.dreamskin` 文件后使用客户端打开；
4. 在客户端确认来源、主题 ID、版本和文件大小；
5. 客户端完成大小、SHA-256、Ed25519 签名、清单和资源校验；
6. 确认安装；安装成功后，再单独确认是否立即应用。

网页只能把导入请求交给客户端，不能把“已点击”当成“已安装成功”。客户端始终是本机安全边界和最终裁决者。

## 客户端兼容状态

| 平台 | 当前状态 |
| --- | --- |
| Windows | 已实现 `.dreamskin` 文件导入、`dreamskin://install`、安全下载、大小与 SHA-256 限制、Ed25519 验证、文件关联、原子安装，以及安装和应用的独立确认。 |
| macOS | 兼容实现代码已经准备，包含本地包、URL handler、下载限制、签名验证和独立确认；尚未在真实 macOS GitHub runner 或设备完成验收。 |

在真实 macOS 验证完成前，本项目不会把 macOS 描述为已经完成实机验收。

## 一键导入协议

商店为拥有完整发布元数据的主题生成以下链接：

```text
dreamskin://install?url=<percent-encoded-https-url>&sha256=<64-lowercase-hex>&size=<decimal>&id=<theme-id>&version=<semver>
```

| 参数 | 要求 |
| --- | --- |
| `url` | 公开、不可变的 GitHub Release HTTPS `.dreamskin` 地址 |
| `sha256` | 整个包文件的 64 位小写十六进制 SHA-256 |
| `size` | 精确字节数，范围为 1–20971520 |
| `id` | 主题包 ID；客户端仍会与包内清单交叉验证 |
| `version` | SemVer 版本；客户端仍会与包内清单交叉验证 |

目录不会为 HTTP 地址、可变下载地址、占位哈希或不完整包信息生成导入链接。完整约束见 [`spec/import-protocol.md`](spec/import-protocol.md)。

## 投稿主题

主题发布采用 GitHub 原生流程：

1. 制作符合 [`spec/theme-package.schema.json`](spec/theme-package.schema.json) 的纯声明式主题包；
2. 使用 Ed25519 签名，并在公开 GitHub Release 上传 `.dreamskin`；
3. Fork 本仓库，在 `catalog/themes/` 新增与 `slug` 同名的 JSON 文件；
4. 运行目录生成和验证命令；
5. 提交 Pull Request，并说明平台验证、素材来源和再分发许可；
6. Actions 自动预检通过后，由维护者进行人工审核；
7. PR 合并后，GitHub Pages 自动发布新版目录。

主题必须是声明式清单和受限图片资源，不接受 JavaScript、HTML、CSS、SVG、Shell、PowerShell、可执行文件、符号链接或其他可执行载荷。详细步骤见 [`docs/theme-submission.md`](docs/theme-submission.md)。

## 本地开发

要求 Node.js `>=22.13.0`。

```bash
git clone https://github.com/lixiaobaivv/Codex-Skin-Store.git
cd Codex-Skin-Store
npm ci
npm run dev
```

常用命令：

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 启动本地开发服务器 |
| `npm run catalog:generate` | 从 `catalog/themes/*.json` 生成类型安全的静态目录 |
| `npm run catalog:check` | 校验目录结构、唯一性、安全边界和生成物一致性 |
| `npm run lint` | 运行代码检查 |
| `npm test` | 构建并运行测试 |
| `npm run build:pages` | 生成 GitHub Pages 静态文件 |

提交代码前建议运行：

```bash
npm run catalog:check
npm run lint
npm test
BUILD_GITHUB_PAGES=true npm run build:pages
```

PowerShell 中可使用：

```powershell
$env:BUILD_GITHUB_PAGES = "true"
npm run build:pages
```

## 项目结构

```text
.github/             投稿模板、PR 模板和 GitHub Actions
app/                 Next.js 页面、布局和全局样式
catalog/themes/      受审核的静态主题目录，一个主题一个 JSON
components/          商店界面组件
docs/                架构和主题投稿文档
lib/                 主题类型、筛选逻辑和生成后的目录
public/              可公开访问的静态资源
spec/                目录、主题包和导入协议规范
tests/               页面渲染与安全契约测试
tools/               目录校验和确定性生成脚本
worker/              本地 vinext 构建入口
```

`main` 分支通过 [`.github/workflows/pages.yml`](.github/workflows/pages.yml) 自动构建并发布到 GitHub Pages。发布过程也会执行主题目录校验，目录不一致时不会部署。

## 安全原则

- 主题内容按不可信输入处理；
- 商店只发布通过 Schema、唯一性和元数据检查的目录条目；
- 客户端先限制下载大小，再校验整个包的 SHA-256；
- SHA-256 负责传输完整性，Ed25519 签名负责发布来源，两者不能互相替代；
- 解包必须拒绝路径穿越、符号链接、压缩炸弹、额外文件和伪造媒体类型；
- 安装和立即应用是两个独立的用户确认动作；
- 未知的 Schema 或包版本必须安全失败；
- 商店不连接本机 CDP，不直接写入主题目录，也不读取任何 Codex 凭证或用户内容。

## 路线图

- [x] 静态主题商店与 GitHub Pages 部署；
- [x] 签名示例主题包；
- [x] Windows 一键导入链路；
- [x] GitHub 原生主题投稿、自动预检和维护者审核；
- [ ] macOS 真实 runner/设备验收；
- [ ] 发布者密钥轮换和版本撤回清单；
- [ ] 更多经过审核的真实主题；
- [ ] 在确有需求后评估账号、上传、审核后台和对象存储；
- [ ] 收藏、评分、举报和创作者工具。

## 参与贡献

代码改进请阅读 [`CONTRIBUTING.md`](CONTRIBUTING.md)。主题作者请从 [`docs/theme-submission.md`](docs/theme-submission.md) 开始。涉及导入协议、安全边界或兼容性的改动，建议先创建 Issue 说明使用场景和迁移方案。

## 许可证

Codex-Skin-Store 的代码采用 [MIT License](LICENSE)。主题作品及其第三方素材仍受各自许可证约束，投稿者必须单独声明来源和再分发权限。
