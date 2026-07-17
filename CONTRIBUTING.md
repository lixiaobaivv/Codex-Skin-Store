# 参与贡献

感谢你帮助完善 Codex-Skin-Store。项目处于早期阶段，协议和主题 schema 的变更会影响商店与客户端两个仓库，因此请让改动保持小、可验证并清楚标注兼容性。

## 开始之前

- 一般缺陷和小型 UI 修复可以直接提交 PR；
- 新功能、数据模型、导入协议或安全边界变更，请先开 issue 说明场景和迁移方案；
- 安全漏洞不要先公开细节，请通过仓库维护者提供的私下渠道报告；若仓库启用了 GitHub Private Vulnerability Reporting，优先使用该入口；
- 不要提交 API Key、`auth.json`、Cookie、客户数据、私有聊天或带隐私的截图。

## 本地环境

需要 Node.js `>=22.13.0`。

```bash
git clone https://github.com/lixiaobaivv/Codex-Skin-Store.git
cd Codex-Skin-Store
npm ci
npm run dev
```

提交前至少运行与改动相关的检查；通常应包含：

```bash
npm run lint
npm test
```

如果检查因平台或外部服务无法运行，请在 PR 中写明实际执行的命令、完整阻塞原因和未覆盖的风险，不要将失败描述为通过。

## 代码与文档约定

- TypeScript、JSON 和 CSS 使用两个空格缩进；
- 保持组件职责单一，优先复用已有工具，不为静态 MVP 引入不必要的服务端依赖；
- 用户可见功能应覆盖加载、空数据、无结果、错误和窄屏状态；
- 协议字段发生变化时，同步更新 `README.md`、`docs/architecture.md`、样例和测试；
- 文档中区分“当前已实现”“本次 PR 实现”和“未来规划”，不要把路线图写成现有能力；
- 提交信息建议使用 `type(scope): summary`，例如 `feat(catalog): add platform filter`。

## 主题目录贡献

普通创作者优先使用[在线主题工坊](https://lixiaobaivv.github.io/Codex-Skin-Store/submit/)生成标准投稿包，再通过主题投稿表单上传。维护者检查素材许可和预览后，把投稿包放入审核分支并创建 PR。

需要完整字段控制的高级作者可以直接提交 GitHub Pull Request。请先阅读 [`docs/theme-submission.md`](docs/theme-submission.md)，在 `catalog/themes/` 新增或更新一个与 `slug` 同名的 JSON 文件，然后运行 `npm run catalog:generate` 并提交同步生成的 `lib/generated-themes.ts`。Actions 会根据封闭 schema 自动预检，维护者审核后才会合并并由 GitHub Pages 发布。

不要把 `.dreamskin` 二进制或签名私钥提交到仓库或投稿表单。投稿者只提交主题工坊生成的标准 ZIP，或在高级 PR 中提交声明式源文件和 `package: null` 的网页草案；审核合并后，维护者运行签名发布工作流，自动同步任务会在双平台验签通过后补全一键导入信息。

一个可审核的主题版本至少应提供：

- 稳定且唯一的主题 ID 与 SemVer 版本；
- 作者/发布者名称和主题作品许可证；
- 与实际包一致的预览图；
- 不可变的 HTTPS 下载 URL、字节大小和 SHA-256；
- 支持的客户端版本与平台；
- 包内文件清单以及每个文件的摘要；
- 使用到的图片、字体等素材的来源和再分发授权。

提交前还应运行：

```bash
npm run catalog:check
npm run lint
npm test
npm run build:pages
```

主题必须是声明式资源。不要包含 JavaScript、HTML、Shell、PowerShell、可执行二进制、符号链接或尝试读取用户数据的内容。任意代码执行不是“高级主题能力”，而是会被拒绝的安全风险。

## Pull Request 清单

- [ ] 改动范围和动机已在 PR 中说明；
- [ ] 没有无关格式化、生成物或依赖更新；
- [ ] 已运行并记录 lint、测试和构建结果；
- [ ] 用户可见变更附有桌面和窄屏截图；
- [ ] 新增数据经过 schema 和边界值验证；
- [ ] 协议、安全或兼容性变更同步更新文档；
- [ ] 没有提交密钥、用户数据或未经许可的素材。

## 许可证

提交到本仓库即表示你有权提供该贡献，并同意代码贡献按仓库的 MIT License 分发。主题作品及第三方素材仍受其各自许可证约束，必须单独声明。
