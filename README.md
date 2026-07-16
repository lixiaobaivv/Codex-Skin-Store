# Codex Dream Skin Store

面向 [Codex Dream Skin 客户端](https://github.com/Fei-Away/Codex-Dream-Skin) 的主题发现与分发平台。

> [!IMPORTANT]
> 本项目是社区项目，不是 OpenAI 或 Codex 官方产品，也不是 Codex 官方插件。商店负责展示和分发主题；真正的下载校验、安装、切换与恢复必须由用户本机的 Codex Dream Skin 客户端完成。

## 当前状态

项目处于早期开发阶段，已经上线由 GitHub Pull Request、Actions 预检和维护者审核驱动的静态主题目录。界面、数据结构和导入协议仍可能调整，请以仓库代码和测试结果为准。

当前阶段的目标是：

- 展示可搜索、可筛选的主题目录和主题详情；
- 为每个版本记录公开下载地址、SHA-256 和客户端兼容信息；
- 生成 `dreamskin://` 一键导入链接；
- 只为具备完整、真实发布元数据的主题生成导入协议，并始终由客户端确认安装和应用；
- 用代码审查维护静态目录，暂不依赖账号、数据库和在线上传后台。
- 让创作者通过 GitHub PR 投稿，合并后由 GitHub Pages 自动发布。

完整的作者上传、审核后台、收藏、评分、举报、对象存储和自动更新属于后续阶段。

## 为什么分成两个项目

| 项目 | 职责 |
| --- | --- |
| Codex Dream Skin | 本机主题引擎、CDP 注入、主题校验、安装、切换和恢复 |
| Codex Dream Skin Store | 主题浏览、检索、版本元数据、下载入口和未来的发布审核 |

商店不会直接连接 Codex 的 CDP 端口，也不应写入用户的主题目录。这个边界可以让网页保持普通的 HTTPS 应用，并把所有高权限操作留在经过用户确认的本机客户端中。

## 静态 MVP

第一版可以只依赖仓库内的主题元数据和公开 HTTPS 文件：

```text
静态主题目录
      │
      ▼
商店页面 ──生成──> dreamskin://install?...  （尚需客户端实现）
                         │
                         ▼
                 本机 Dream Skin 客户端
                         │
               下载 → 校验 → 确认 → 安装
```

这样可以先验证主题浏览和一键导入体验，不必过早引入账号系统、D1 数据库或 R2 存储。当前 `.openai/hosting.json` 没有启用 D1/R2 绑定，相关目录只是为未来服务端能力预留。

## 一键导入契约

商店采用以下 MVP v1 契约生成链接：

```text
dreamskin://install?url=<percent-encoded-https-url>&sha256=<64-lowercase-hex>&size=<decimal>&id=<theme-id>&version=<semver>
```

示例中的摘要仅为占位值，不对应真实主题包：

```text
dreamskin://install?url=https%3A%2F%2Fcdn.example.com%2Fthemes%2Fsakura%2F1.0.0.dreamskin&sha256=0000000000000000000000000000000000000000000000000000000000000000&size=1&id=dreamskin.sakura-night&version=1.0.0
```

- `url`：必填，经过百分号编码的公开 HTTPS `.dreamskin` 包地址；
- `sha256`：必填，下载文件的 64 位小写十六进制 SHA-256；
- `size`：必填，下载文件的十进制字节数，范围为 1–20971520；
- `id`、`version`：可选的显示/诊断提示，客户端不得用它们替代包内清单验证。

Windows 客户端已经实现 `.dreamskin` 文件与 `dreamskin://` 导入、安全下载、摘要与 Ed25519 签名校验，并将安装和应用分开确认。兼容的 macOS 实现代码已经准备，但尚未在真实 macOS runner/设备完成验证，因此商店不会把 macOS 支持描述为已完成实机验收。详见[架构与协议说明](docs/architecture.md)。

## 本地开发

要求 Node.js `>=22.13.0`。

```bash
git clone https://github.com/lixiaobaivv/Codex-Skin-Store.git
cd Codex-Skin-Store
npm ci
npm run dev
```

## GitHub Pages

`main` 分支会通过 `.github/workflows/pages.yml` 构建纯静态站点并发布到：

`https://lixiaobaivv.github.io/Codex-Skin-Store/`

页面和签名主题包都由 GitHub 托管，不需要应用服务器、数据库或对象存储。

浏览器地址以终端输出为准，默认通常为 `http://localhost:3000`。

提交前建议运行：

```bash
npm run lint
npm test
```

其他常用命令：

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 启动 vinext 本地开发服务器 |
| `npm run catalog:generate` | 从 `catalog/themes/*.json` 生成类型安全的商店目录 |
| `npm run catalog:check` | 校验目录结构、唯一性、安全边界和生成物一致性 |
| `npm run build` | 生成生产构建并检查构建错误 |
| `npm run start` | 启动生产模式服务器 |
| `npm test` | 构建并运行渲染结果测试 |

## 目录结构

```text
app/                 页面、布局和商店 UI
catalog/themes/      一个主题一个 JSON 的受审核静态目录
public/              可公开访问的静态资源
spec/                目录与签名主题包的封闭 schema
tools/               目录校验和确定性生成脚本
tests/               构建产物与页面渲染测试
worker/              vinext 的 Cloudflare Worker 入口
db/                  未来数据库表结构（当前不应成为静态 MVP 依赖）
drizzle/             未来 Drizzle 迁移元数据
examples/d1/         可选的 D1 示例，不是商店业务实现
docs/architecture.md 架构、安全模型与导入契约
```

## 安全原则

- 主题必须是声明式数据和受限图片资源，MVP 不接受 JavaScript、HTML、Shell、PowerShell 或其他可执行载荷；
- 不允许主题包提供可在 Codex 页面上下文执行的任意代码；
- 下载后先校验 SHA-256，再解析清单；哈希保证传输完整性，但不能替代发布者签名；
- 解包必须防止路径穿越、符号链接逃逸、压缩炸弹、伪造图片类型和覆盖已有文件；
- 安装、升级、降级和立即应用均由客户端展示来源、权限和兼容性后让用户确认；
- 正式上传流程需要自动扫描和人工审核，并保留撤回、举报与版本封禁能力；
- 商店不得收集 Codex 凭证、API Key、`auth.json`、用户项目内容或本机 CDP 数据。

## 路线图

- **阶段 0：静态 MVP** — 主题目录、筛选、详情和协议预览；
- **阶段 1：客户端导入** — 已签名 `.dreamskin` 规范、URL 协议/文件关联、校验、原子安装及 macOS/Windows 对齐；
- **阶段 2：可信发布** — 发布者身份、密钥轮换、兼容矩阵、撤回清单和自动更新；
- **阶段 3：创作者平台** — 账号、上传、自动检查、人工审核、版本管理和对象存储；
- **阶段 4：社区能力** — 收藏、评分、举报、精选专题和创作者工具。

## 参与贡献

欢迎提交问题、主题规范建议和代码改进。开始前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。涉及协议或安全模型的改动，建议先开 issue 讨论并同时更新架构文档。

## 许可证

本项目采用 [MIT License](LICENSE)。主题作品本身的许可与版权由各主题作者在其清单中单独声明。
