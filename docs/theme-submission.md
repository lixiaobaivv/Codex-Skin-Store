# 主题制作与投稿

Codex-Skin-Store 提供在线主题工坊。普通创作者不需要 Fork 仓库、安装开发工具、手写 JSON、生成目录索引或接触签名私钥。

## 最短投稿流程

1. 打开 [在线主题工坊](https://lixiaobaivv.github.io/Codex-Skin-Store/submit/)；
2. 填写主题名称、作者、简介与稳定的英文主题 ID；
3. 调整主题颜色和首页文案，在右侧即时检查效果；
4. 上传一张来自真实 Codex 界面的 PNG 预览图，可选上传背景图；
5. 在工坊中说明主题和每项素材的作者、来源与再分发许可；这段说明会直接写入投稿包，不需要在 Issue 中重复填写；
6. 点击“生成标准投稿包”，再打开投稿页并把 ZIP 拖入指定区域。

工坊会自动保存文字草稿，并生成以下文件：

```text
themes/<theme-id>.json
catalog/themes/<theme-id>.json
previews/<theme-id>.png
public/theme-previews/<theme-id>.png
backgrounds/<theme-id>.<ext>  # 可选
SUBMISSION.md
```

投稿包只有声明式 JSON 和图片。维护者审核后，由可信 CI 校验、构建、签名、双平台验签并发布 `.dreamskin`；投稿者不需要准备下载地址、文件大小、SHA-256 或签名包。

社区投稿的商店条目使用 `license.source: creator-submitted-assets`，与项目维护者整理的 `project-curated-assets` 明确区分。素材许可说明至少需要 20 个字符，并明确原创、授权、许可证名称或来源链接；“网络素材”“123”等占位内容会被拒绝。

## 图片与 ID

- 主题 ID 使用两个以上小写英文或数字单词并以连字符连接，例如 `ocean-night`，发布后不可修改或转让；
- 真实效果预览必须为接近 16:10 的横向 PNG，至少 1200×750、最大边 2400px、文件不超过 2 MB；预览必须展示真实 Codex 界面，不能直接复用背景原图；
- 可选背景接受 PNG 或 JPEG，建议至少 1600px 宽、最大边 8192px、文件不超过 16 MB；
- 截图不能包含私有项目、对话、账号、密钥或其他个人信息；
- 图片必须是原创内容，或已经取得投稿、公开展示和再分发许可。

## 审核与发布

提交投稿表单不等于自动发布。维护者会检查：

- 真实预览与主题效果一致；
- 文字、图片和人物素材不存在明显的冒充、版权或许可问题；
- 主题保持声明式，不包含脚本、HTML、CSS、SVG、可执行文件或符号链接；
- 主题在支持的平台上可读、可切换且可回滚；
- 主题 ID、版本和目录条目没有冲突。

维护者不需要手工解压投稿包。打开仓库 **Actions → Create theme review PR from Issue → Run workflow**，输入投稿 Issue 编号：

- 工作流只接受一个标准 GitHub ZIP 附件；
- 限制压缩包、解压总量、文件数量和精确白名单路径，拒绝路径穿越及额外文件；
- 检查 ID、版本、作者、许可类型、图片签名、预览尺寸、预览一致性和背景复用；
- 自动登记 `theme-repository.json`，保存 `submissions/<theme-id>.md` 审核来源并重新生成目录；
- 运行目录、Lint、测试和静态构建检查；
- 全部通过后创建独立分支和 Draft PR，并在 Issue 中回复 PR 链接；失败时只回复运行日志，不修改 `main`。

Draft PR 仍需维护者人工检查真实视觉、素材权利、隐私信息和双平台效果。PR 合并后，`Closes #<Issue>` 会关闭投稿 Issue。维护者再运行 **Publish reviewed Codex-Skin themes** 作为发布批准。发布工作流从精确 Store 合并提交构建并签名 `.dreamskin`，完成 Windows、macOS 双平台验签后创建不可变 Release。Store 随后重新下载、复验并更新远程增量目录。

需要本地诊断 ZIP 时可以只校验、不写仓库：

```bash
node tools/import-theme-submission.mjs --archive path/to/submission.zip --check-only
```

## 高级作者流程

需要 Logo、宠物、四张自定义快捷卡、字体或完整文案控制的作者，可以直接提交仓库 PR：

1. 按 `schemas/theme-v1.schema.json` 创建 `themes/<theme-id>.json`；
2. 将素材放入 `previews/`、`backgrounds/`、`logos/` 和 `pets/`；
3. 在 `catalog/themes/<theme-id>.json` 创建 `package: null` 的商店条目；
4. 运行 `npm run catalog:generate`、`npm run catalog:check`、`npm run lint`、`npm test` 和 `npm run build:pages`；
5. 创建 PR，并附上真实截图、测试平台和完整素材许可。

高级流程同样不允许任意 CSS 或代码。主题编译始终由可信 Rust 编译器完成，用户提交内容不能改变项目、任务、对话、账号数据或客户端原生行为。

## 更新与下架

更新已有主题时保持主题 ID 不变并提升 SemVer 版本。已经发布的内容如发现安全、版权或欺诈问题，可以从远程目录下架；客户端仍会对本地缓存执行签名和完整性校验。
