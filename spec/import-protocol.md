# Codex-Skin 主题包与导入协议（MVP v1）

## 1. 目标与边界

本协议定义商店、`.dreamskin` 文件和 Codex-Skin 客户端之间的最小互操作契约。主题只能声明文字、颜色和受限位图资源；主题包不得携带或执行 JavaScript、CSS、HTML、SVG、WASM、Shell、PowerShell 或其他代码。

规范中的“必须”“不得”“应当”是实现要求。客户端不能仅依赖 JSON Schema；压缩包、资源内容、签名和运行时兼容性都需要独立校验。

## 2. `.dreamskin` 文件格式

`.dreamskin` 是使用 ZIP 容器的主题包，推荐媒体类型为：

```text
application/vnd.codex-dream-skin+zip
```

包根目录只允许以下三个普通文件，不允许额外文件：

```text
<theme-id>-<version>.dreamskin
├── theme.json
├── background.webp   # 也可以是 .png、.jpg 或 .jpeg
└── preview.webp      # 也可以是 .png、.jpg 或 .jpeg
```

文件名由 `theme.json` 的 `assets` 字段确定。`image` 必须与 `assets.background.path` 完全相同。主题包不得包含目录、链接、设备文件、备用数据流或加密条目。

### 2.1 硬性限制

| 项目 | 上限或规则 |
| --- | --- |
| ZIP 文件 | 28 MiB |
| 解压后总大小 | 28 MiB，流式执行，不能信任 ZIP 元数据 |
| `theme.json` | 64 KiB，严格 UTF-8，无 BOM |
| 背景图 | 16 MiB，最大 8192 × 8192，最大 40 MP |
| 预览图 | 2 MiB，最大 2400 × 2400，最大 8 MP |
| ZIP 条目 | 恰好 3 个普通文件 |
| 图片类型 | 静态 PNG、JPEG 或 WebP |

客户端必须拒绝以下内容：

- 绝对路径、`..`、反斜杠、NUL、Windows 盘符、UNC 路径、NTFS ADS 和规范化后重名的条目。
- 符号链接、硬链接、稀疏文件、加密 ZIP、嵌套压缩包和未知压缩算法。
- SVG、GIF、APNG、动画 WebP、多帧图片，以及扩展名、声明 MIME、文件魔数不一致的图片。
- 解码后超过尺寸或像素上限、解码失败、尾随可疑载荷的图片。
- 任何未在根目录白名单中出现的文件，尤其是 `.js`、`.css`、`.html`、`.wasm` 和可执行文件。

图片应使用内存安全的解码器完整解码一次。实现必须在读取和解压过程中持续计数，并在到达上限时立即停止，避免 ZIP 炸弹与图片解压炸弹。

## 3. `theme.json`

`theme.json` 必须通过 [theme-package.schema.json](./theme-package.schema.json) 校验。根对象和所有子对象都禁止未知字段。关键语义检查如下：

- `id` 是不可变的商店全局标识，推荐格式为 `publisher.theme-name`。同一 `id` 的后续发布只增加 `version`。
- `version` 和 `engineVersion` 使用 SemVer。只有满足 `min <= 当前引擎版本 < maxExclusive` 才能导入。
- 当前平台必须出现在 `platforms` 中。
- `image` 必须严格等于 `assets.background.path`。
- 每个资源的实际字节数、像素尺寸、文件类型与 SHA-256 必须和 `assets` 中的声明一致。
- 文本必须规范化为 Unicode NFC；客户端应拒绝控制字符和危险的双向文本控制字符。
- 所有文本只能作为纯文本渲染，不得传入 `innerHTML`；颜色只能使用 Schema 允许的十六进制或 `rgba()` 文法，不能拼接为任意 CSS。

`schemaVersion: 1`、`image`、文字与 `colors` 字段可被现有 Codex-Skin 注入器直接读取。`packageVersion`、`assets`、`engineVersion` 和 `signature` 由导入器及商店使用，运行时不会执行这些字段。

## 4. 完整性与签名

本协议使用两层完整性保护：

1. 商店目录、下载 API 和 `dreamskin://` 深链接提供整个 `.dreamskin` 文件的 SHA-256。
2. `theme.json` 为背景图和预览图分别提供 SHA-256，并使用 Ed25519 绑定清单与资源摘要。

完整压缩包哈希不能写入包自身，否则会形成自引用，因此它必须在包外传递。所有 SHA-256 都使用小写十六进制。

### 4.1 签名生成与验证

签名载荷按以下步骤生成：

1. 将 `theme.json` 解析为严格 JSON；拒绝重复键、无效 UTF-8 和尾随数据。
2. 从对象中删除 `signature.value`，保留 `algorithm`、`canonicalization`、`keyId` 和 `signedAt`。
3. 按 RFC 8785（JSON Canonicalization Scheme）序列化为 UTF-8 字节。
4. 使用 `signature.keyId` 对应的 Ed25519 私钥直接签名字节。
5. 将 64 字节签名编码为无填充 base64url，写回 `signature.value`。

验证顺序必须是：包 SHA-256 → 安全枚举 ZIP → Schema 与语义 → 签名 → 资源 SHA-256 → 图片完整解码。`keyId` 只是索引，不代表可信；客户端必须从随应用发布或经过受信任更新机制获得的密钥环中查找公钥，不得信任包内附带的公钥。

商店发布包必须有受信任签名。开发版客户端可以在明确开启开发模式后导入由开发者自签名但密钥尚未受信任的本地包；包仍必须包含结构完整且数学验证有效的签名。客户端必须显示不可跳过的风险提示、不得自动应用，也不得把该能力暴露给网页深链接。协议 v1 不允许无签名包。

## 5. `dreamskin://install` 深链接

规范形式：

```text
dreamskin://install?url=<percent-encoded-https-url>&sha256=<64-lower-hex>&size=<decimal>&id=<theme-id>&version=<semver>
```

字段定义：

| 字段 | 必需 | 说明 |
| --- | --- | --- |
| `url` | 是 | UTF-8 百分号编码的绝对 HTTPS 下载地址 |
| `sha256` | 是 | `.dreamskin` 文件的 SHA-256 |
| `size` | 是 | 商店声明的包字节数，范围为 1 到 29360128 |
| `id` | 否 | 仅用于下载前提示；下载后必须与清单一致 |
| `version` | 否 | 仅用于下载前提示；下载后必须与清单一致 |

示例：

```text
dreamskin://install?url=https%3A%2F%2Fthemes.example.com%2Fpackages%2Flixiaobai.sakura-night-1.2.0.dreamskin&sha256=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef&size=7340032&id=lixiaobai.sakura-night&version=1.2.0
```

客户端必须：

- 只接受 host 为 `install`、无用户名密码、无 fragment、没有未知或重复查询参数的链接。
- 限制深链接总长度，建议不超过 4096 字节；解析一次且只解析一次百分号编码。
- 只允许 HTTPS。默认拒绝 loopback、私网、链路本地、组播、保留地址和非 443 端口，并在每次重定向后重新解析 DNS 与检查目标。
- 最多跟随 3 次 HTTPS 重定向；禁止 HTTPS 降级，不转发 Cookie、Authorization 或商店页面凭据。
- 在读取响应体前校验 `Content-Length`（如果存在），下载时仍须执行 28 MiB 流式硬限制。
- 将 `id` 和 `version` 当作不可信提示，不得用它们决定安装路径。
- 只有在明确的用户点击后打开导入确认界面。协议唤起本身不得静默下载、安装或应用主题。

网页不需要访问本机 HTTP 端口。商店按钮可以使用深链接，并同时提供“下载 `.dreamskin` 文件”的回退操作。深链接中不得携带长期令牌或个人信息。

## 6. 本地文件导入

客户端注册 `.dreamskin` 文件关联后，双击文件进入与深链接相同的校验流程。由于本地文件没有包外预期哈希，客户端仍计算并显示整个文件的 SHA-256，并依靠受信任的内嵌签名验证来源。

文件关联参数只接受系统传入的单个绝对文件路径。客户端不得把路径拼接进 Shell 命令，也不得自动应用成功导入的主题。

## 7. 安装事务

推荐使用不可变版本目录和一个原子更新的注册表指针：

```text
themes/
├── packages/<theme-id>/<version>/
│   ├── theme.json
│   ├── background.webp
│   └── preview.webp
└── active.json
```

导入流程：

1. 在主题目录所在卷创建权限仅限当前用户的随机 staging 工作目录，并在其中分开创建 `archive.tmp` 与 `payload/`，然后获取该主题的进程间锁。
2. 下载或复制到 `archive.tmp`，安全解压到 `payload/`；完成全部哈希、结构、Schema、签名、兼容性和图片校验。
3. 从经过验证的清单重新计算目标目录，禁止直接使用 URL、ZIP 条目或用户输入作为路径。
4. 将只含三个已验证文件的 `payload/` 重命名为不可变版本目录。已存在且内容哈希相同视为幂等成功；内容不同则报告冲突。
5. 如用户选择立即应用，先以临时文件写入新 `active.json`，刷新到磁盘后在同一卷原子替换。应用失败时恢复旧指针。
6. 成功或失败后清理 staging 工作目录；失败时保留当前主题和上一个可用版本。任何时候都不得就地覆盖正在使用的文件。

若现有客户端暂时只能使用 `themes/<id>/`，实现应在同一父目录中完成“staging → 备份旧目录 → 提交新目录”的可回滚事务，并持有锁；后续应迁移到版本目录与原子指针方案。

## 8. 建议错误契约

客户端和商店可以共享以下稳定错误结构：

```json
{
  "code": "DSI_HASH_MISMATCH",
  "stage": "verify",
  "retryable": false,
  "message": "下载文件与商店摘要不一致。"
}
```

`message` 可本地化，程序逻辑只能依赖 `code`。建议错误码：

| 错误码 | 含义 |
| --- | --- |
| `DSI_INVALID_DEEP_LINK` | 深链接格式、host 或参数无效 |
| `DSI_UNSUPPORTED_SCHEME` | 下载地址不是 HTTPS |
| `DSI_BLOCKED_NETWORK_TARGET` | 地址解析到禁止的网络目标 |
| `DSI_DOWNLOAD_FAILED` | 网络或 HTTP 下载失败 |
| `DSI_REDIRECT_BLOCKED` | 重定向次数或目标不安全 |
| `DSI_SIZE_LIMIT` | 压缩包、条目、解压总量或图片超过限制 |
| `DSI_HASH_MISMATCH` | 包或资源 SHA-256 不一致 |
| `DSI_INVALID_ARCHIVE` | ZIP 损坏、加密或结构不合法 |
| `DSI_UNSAFE_PATH` | ZIP 条目路径、类型或规范化结果不安全 |
| `DSI_MANIFEST_INVALID` | JSON、Schema 或跨字段语义校验失败 |
| `DSI_UNSUPPORTED_ENGINE` | 当前引擎不在兼容版本范围内 |
| `DSI_UNSUPPORTED_PLATFORM` | 清单不支持当前平台 |
| `DSI_ASSET_INVALID` | 图片格式、尺寸、帧数或解码失败 |
| `DSI_SIGNATURE_MISSING` | 发布包缺少签名 |
| `DSI_SIGNATURE_UNTRUSTED` | `keyId` 不在客户端信任密钥环中 |
| `DSI_SIGNATURE_INVALID` | Ed25519 签名验证失败 |
| `DSI_THEME_ID_CONFLICT` | 相同 ID 和版本已有不同内容 |
| `DSI_ALREADY_INSTALLED` | 相同内容已经安装，可视为幂等成功 |
| `DSI_BUSY` | 同一主题正在被另一个导入事务处理 |
| `DSI_DISK_FULL` | staging 或提交时磁盘空间不足 |
| `DSI_COMMIT_FAILED` | 原子提交或注册表切换失败且已回滚 |
| `DSI_USER_CANCELLED` | 用户在确认界面取消 |

错误日志和遥测不得包含带令牌的 URL、用户本地绝对路径、主题图片内容或签名私钥信息。

## 9. 商店发布要求

商店应在服务端重复执行客户端的所有静态校验，并只从经过校验的资源生成预览。上传内容先进入隔离区；审核通过和签名完成后才能进入公开目录。

下载 API 至少返回以下不可变元数据：

```json
{
  "id": "lixiaobai.sakura-night",
  "version": "1.2.0",
  "url": "https://themes.example.com/packages/lixiaobai.sakura-night-1.2.0.dreamskin",
  "bytes": 7340032,
  "sha256": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
}
```

同一 `id` 与 `version` 一经发布不可替换；修复必须发布新版本。撤销的签名密钥和恶意包摘要应通过受签名的客户端信任列表更新，下架页面不能替代客户端侧撤销。
