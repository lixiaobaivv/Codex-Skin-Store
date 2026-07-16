# 主题投稿指南

Dream Skin Store 采用 GitHub 原生投稿：GitHub 身份、Pull Request、Actions 自动预检和维护者审核共同组成发布流程。合并到 `main` 后，GitHub Pages 会重新生成静态商店；整个流程不需要自有账号服务器、数据库或对象存储。

## 投稿前准备

1. 按 [`theme-package.schema.json`](../spec/theme-package.schema.json) 制作纯声明式主题包并使用受信任 Ed25519 密钥签名；
2. 在你控制的公开 GitHub 仓库创建不可变 Release，上传 `.dreamskin` 文件；
3. 计算文件的精确字节数和小写 SHA-256；
4. 在 macOS 和/或 Windows 客户端验证“下载、校验、安装、单独确认应用”的完整流程；
5. 准备主题作品以及图片、字体等全部素材的作者、来源和可再分发许可。

未完成签名发布时可以提交 `package: null` 的预览草案，但它不会显示一键导入或手动下载入口，也不代表商店已经发布该主题。

## 提交目录 PR

1. Fork 本仓库并新建分支；
2. 复制一个 `catalog/themes/*.json` 条目，文件名必须等于 `<slug>.json`；
3. 只填写 [`store-theme.schema.json`](../spec/store-theme.schema.json) 允许的字段；
4. 运行 `npm run catalog:generate`，提交同步生成的 `lib/generated-themes.ts`；
5. 运行 `npm run catalog:check`、`npm run lint`、`npm test` 和 `npm run build:pages`；
6. 创建 Pull Request，并完整填写投稿清单和素材许可。

一个可发布条目的 `package` 必须完整包含：

```json
{
  "published": true,
  "id": "author.theme-id",
  "version": "1.0.0",
  "url": "https://github.com/author/theme/releases/download/v1.0.0/theme-1.0.0.dreamskin",
  "sha256": "<64 位小写十六进制摘要>",
  "size": 1234567
}
```

目录拒绝可变下载地址、HTTP、非 GitHub Release 包、占位哈希、重复 slug、重复包 ID/版本、未知字段和超出 20 MiB 的包。CI 不会执行主题中的任何内容，也不会把主题代理到商店服务器。

## 审核与发布

Actions 通过只代表结构和构建预检成功，不代表作品获得发布资格。维护者仍会检查预览一致性、冒充、版权、素材许可、平台兼容性和包签名。维护者合并 PR 后，GitHub Pages 自动更新；Release 文件仍由创作者或项目的 GitHub 仓库托管。

已经发布的内容如发现安全、版权或欺诈问题，可以撤下目录条目。未来若投稿量确实需要账号、上传队列和对象存储，再单独评估服务成本和治理方案。
