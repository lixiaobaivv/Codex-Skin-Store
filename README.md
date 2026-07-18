# Codex-Skin-Store

[简体中文](README.md) | [English](README.en.md)

Codex-Skin-Store 是 Codex-Skin 的公开主题商店。你可以在网页中浏览、筛选和下载主题，也可以通过 `dreamskin://` 一键交给本机 Codex-Skin 客户端验证和安装。

网页只展示已经完成审核、签名和目录同步的正式主题，预览图直接来自客户端真实主题效果。

- 在线商店：<https://lixiaobaivv.github.io/Codex-Skin-Store/>
- 无代码主题工坊：<https://lixiaobaivv.github.io/Codex-Skin-Store/submit/>
- 主题投稿说明：<https://github.com/lixiaobaivv/Codex-Skin-Store/blob/main/docs/theme-submission.md>
- 客户端下载：<https://github.com/lixiaobaivv/Codex-Skin/releases/latest>
- 客户端使用说明：<https://github.com/lixiaobaivv/Codex-Skin#readme>

> Codex-Skin-Store 是社区开源项目，不是 OpenAI 或 Codex 官方产品。网页不会读取 Codex 凭证、API Key、项目、任务或聊天内容，也不会连接本机 CDP。

## 开始使用

1. 安装适合系统的 Codex-Skin 客户端。
2. Windows 推荐使用 `Codex-Skin-Setup-win-x64.exe`；macOS 使用对应芯片的 `Codex-Skin-osx-*.pkg`。
3. 至少启动一次 Codex-Skin。
4. 打开 [在线主题商店](https://lixiaobaivv.github.io/Codex-Skin-Store/)。
5. 选择主题后点击“一键导入”。
6. 在客户端中确认来源、版本和大小。
7. 验证安装完成后，再决定是否立即重启 Codex 并应用。

网页只能发起导入请求，不能绕过客户端确认，也不能把“已点击”当成“已安装”。

如果 Codex-Skin 已经打开，一键导入会直接激活现有窗口并在那里显示确认与下载进度；只有客户端尚未运行时才会创建新窗口。

## 一键导入支持

### Windows

Windows 只提供 `Codex-Skin-Setup-win-x64.exe`。Setup 会自动注册 `dreamskin://` 和 `.dreamskin` 文件关联，不再提供 ZIP 或直接运行的便携包。

### macOS

新版 PKG 会声明 `dreamskin://` 和 `.dreamskin` 文件类型。安装后先打开一次 `Codex-Skin.app`，让 macOS LaunchServices 完成关联。

macOS PKG 当前未签名、未公证。系统阻止打开时，请先校验下载文件，再到“系统设置 → 隐私与安全性”确认打开。

## GitHub 镜像加速

客户端或主题包下载缓慢时，可以把原始 GitHub 地址放到镜像前缀后。

例如客户端原始地址：

```text
https://github.com/lixiaobaivv/Codex-Skin/releases/latest/download/Codex-Skin-Setup-win-x64.exe
```

GHFast：

```text
https://ghfast.top/https://github.com/lixiaobaivv/Codex-Skin/releases/latest/download/Codex-Skin-Setup-win-x64.exe
```

GH Proxy：

```text
https://gh-proxy.com/https://github.com/lixiaobaivv/Codex-Skin/releases/latest/download/Codex-Skin-Setup-win-x64.exe
```

手动下载 `.dreamskin` 主题包时也可以使用相同方法。网页“一键导入”始终传递目录中经过审核的原始 HTTPS 地址；客户端会显示下载状态和最终结果，并按用户当前选择、GitHub 官方和内置镜像线路自动重试，但不会信任网页临时替换的下载信息。

客户端同步主题目录时也会自动回退线路：先尝试上次实际成功或用户选择的线路，再尝试 GitHub 和其余内置镜像；完整校验通过后保存本次成功线路，供下次启动优先使用。

镜像是第三方服务，可能不可用或返回旧缓存。下载客户端后请对照 Release 中的 `Codex-Skin-installers-SHA256SUMS.txt`；主题包则由客户端同时校验精确大小、SHA-256 和 Ed25519 签名，镜像返回旧文件时不会安装。

## 客户端如何保护导入

每次网页导入都会经过：

1. 严格解析 `dreamskin://install` 参数；
2. 拒绝 HTTP、私网、本机地址、异常端口和危险重定向；
3. 限制 URI、下载包、ZIP 条目和解压后文件大小；
4. 校验整包 SHA-256；
5. 校验 Ed25519 发布者签名；
6. 校验封闭 JSON Schema、主题 ID、版本和支持平台；
7. 完整解码并检查图片格式、尺寸、动画和尾随数据；
8. 原子安装，失败时不覆盖已有主题；
9. 安装和应用分别确认。

主题包不允许携带 JavaScript、HTML、CSS、SVG、Shell、PowerShell、可执行程序、符号链接或额外文件。

## 商店里的两类主题目录

本仓库维护两套独立目录：

- 网页目录位于 `catalog/themes/`，提供签名 `.dreamskin` 包的版本、大小、SHA-256、平台和展示信息；
- 桌面主题源由根目录 `theme-repository.json`、`themes/`、`previews/`、`backgrounds/`、`logos/` 和 Schema 组成；CI 从它们生成内容寻址的 `desktop-catalog-v2.json` 轻量分发索引。

客户端固定从本仓库 `main` 分支条件同步轻量索引，只能选择 GitHub、GH Proxy 或 GHFast 网络源，不能切换到未经审核的仓库。预览进入可视区域时才下载，完整资源在应用前按需下载；索引声明的大小和 SHA-256 会在客户端本机重新校验。

## 主题可以修改什么

主题可以修改 Codex 的背景、固定侧栏视觉、顶部区域、首页引导、四张快捷提示卡、消息气泡、输入框和可选宠物图片。

主题不能修改用户项目、任务、进度、对话内容、账号数据或 Codex 业务逻辑。

## 常见问题

### 点击“一键导入”没有反应

- 确认已经安装并至少打开过一次 Codex-Skin；
- Windows Setup 可以重新运行安装器修复关联；
- macOS 确认安装的是支持 URL handler 的新版 PKG；
- 也可以选择“手动下载”，然后双击 `.dreamskin` 文件。

### 客户端提示哈希或签名错误

不要继续安装。重新从商店下载；如果仍失败，请在主题详情和客户端仓库提交 Issue，附上主题名称、版本和错误代码。

### GitHub 或镜像下载失败

直连、GHFast 和 GH Proxy 可能在不同网络下表现不同。切换线路后重试，但不要跳过 SHA-256 校验。

### 导入成功但没有自动换主题

这是正常安全设计。安装完成后客户端会单独询问是否重启 Codex 并应用；你也可以稍后从客户端选择主题。

## 投稿主题

任何人都可以通过 [在线主题工坊](https://lixiaobaivv.github.io/Codex-Skin-Store/submit/) 投稿，不需要 Fork 仓库、安装 Node.js 或 Rust、手写 JSON、维护目录索引、计算哈希或接触官方签名私钥：

1. 填写主题名称、稳定的英文主题 ID、作者和素材许可；
2. 调整颜色与首页文案，在页面右侧即时预览；
3. 上传来自真实 Codex 界面的 PNG 效果图和可选背景；
4. 点击“生成标准投稿包”，下载 `codex-skin-submission-<主题ID>-1.0.0.zip`；
5. 点击“打开投稿页”，把 ZIP 拖入“标准投稿包”区域，等待上传完成后提交。

工坊会自动保存当前浏览器中的文字草稿。图片不会写入浏览器持久存储，刷新页面后需要重新选择。生成的 ZIP 包含：

```text
themes/<theme-id>.json                 桌面主题清单
catalog/themes/<theme-id>.json         package: null 的商店草案
previews/<theme-id>.png                客户端预览
public/theme-previews/<theme-id>.png   网页预览
backgrounds/<theme-id>.<ext>           可选背景
SUBMISSION.md                           作者与素材许可
```

提交表单不会立即上线主题。维护者在 GitHub Actions 中输入 Issue 编号，手动运行 **Create theme review PR from Issue**。工作流会安全下载唯一 ZIP，限制大小、文件数和白名单路径，检查清单、社区许可、图片签名与真实预览尺寸，保存审核来源，重新生成目录并运行完整测试；通过后只创建 Draft PR，不直接修改 `main` 或发布主题。失败时会在 Issue 中给出日志链接。

维护者在 Draft PR 中继续检查真实视觉、可读性、隐私、主题 ID 冲突和素材权利。审核合并后，可信发布流程从精确 Store 提交构建和签名 `.dreamskin`，完成 Windows、macOS 双平台验签，再自动回填版本、下载地址、大小和 SHA-256，并更新网页及桌面轻量目录。

需要自定义 Logo、宠物、四张快捷卡、字体或全部首页文案的作者仍可使用 [高级 PR 流程](docs/theme-submission.md#高级作者流程)。普通投稿和高级投稿都只能包含声明式主题数据与允许的图片，不能加入任意 CSS、JavaScript、HTML、SVG、脚本或可执行文件。

主题 ID 发布后不能改名，更新时只提升 SemVer 版本。素材来源、再分发许可和真实预览必须准确；商店代码的 MIT 许可证不会自动覆盖主题作品。

## 隐私与安全

- 商店是静态 GitHub Pages，不需要在线账号；
- 不使用自建应用服务器、数据库或对象存储；
- 工坊在浏览器本地生成 ZIP，不会把未提交的主题或图片上传到项目服务器；
- 网页不探测本机客户端状态，不读取 Codex 数据；
- 客户端是最终信任边界；
- 有问题的主题可以下架，但已下载文件仍应依靠客户端签名与撤回策略处理。

## 许可与免责声明

- 本仓库的软件代码依照 [MIT License](LICENSE) 开源。主题作品及其中的图片、照片、插画、字体、标识、人物姓名或形象等内容不因收录于本仓库而自动适用 MIT License；它们仍分别受原作者声明的许可及适用法律保护。
- 投稿者须确保自己拥有相关内容，或已经取得提交、修改、公开展示及再分发所需的全部授权。涉及明星、公众人物或其他可识别个人时，投稿者还须自行确认肖像权、姓名权、隐私权、人格权、著作权、商标权以及商业使用等要求；“来源于互联网”、注明出处、粉丝创作或使用 AI 生成，均不当然代表可以合法使用或再分发。
- 除非另有明确书面说明，主题中出现的人物、艺人、品牌、组织、作品名称或标识，仅用于描述主题内容，不表示相关权利人与本项目存在赞助、授权、认可、合作或其他关联。本项目也不是 OpenAI 或 Codex 官方产品。
- 投稿者对其提交内容及由此引起的权利主张承担责任。自动校验、人工审核、合并或发布不构成对内容权属、合法性或适用场景的法律确认，也不代表维护者为投稿者取得了任何授权。
- 如你认为仓库中的内容侵犯了你的合法权益，请通过 [Issue](https://github.com/lixiaobaivv/Codex-Skin-Store/issues) 提供具体主题、权利依据和相关链接；如需避免公开个人信息，可在 Issue 中仅说明需要私下联系。维护者可在核实期间限制访问，并有权拒绝、下架或移除存在侵权、冒充、误导、隐私或其他合规风险的内容。
- 本项目及商店内容按“现状”提供，不保证所有主题在任何地区或用途下均可合法使用，也不保证其准确性、持续可用性、兼容性或不侵害第三方权利。用户应在下载、分享、公开展示或商业使用前自行核实许可并承担相应风险；在适用法律允许的最大范围内，项目维护者不对因使用主题或第三方素材产生的损失或争议负责。

协议和安全细节见 [架构文档](docs/architecture.md)、[导入协议](spec/import-protocol.md)、[主题包 Schema](spec/theme-package.schema.json) 和 [桌面目录规范](spec/desktop-theme-repository.md)。

商店页面或主题目录问题请提交 [Issue](https://github.com/lixiaobaivv/Codex-Skin-Store/issues)。开发者需要的本地构建、测试和贡献流程位于 [CONTRIBUTING.md](CONTRIBUTING.md)，普通用户不需要安装 Node.js 或克隆仓库。

## 友链

**LinuxDo** — [https://linux.do](https://linux.do/)
