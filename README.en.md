# Codex-Skin-Store

[简体中文](README.md) | [English](README.en.md)

Codex-Skin-Store is the public theme catalog for Codex-Skin. Browse themes on the web, download them manually, or send a signed theme to the Windows or macOS client with one click.

The storefront currently publishes Dilraba Star, ENFP Pop, Jackson Sage, KUN Stage, and Zhu Xudan Racing. Every card uses a real client theme preview.

- Storefront: <https://lixiaobaivv.github.io/Codex-Skin-Store/>
- No-code Theme Workshop: <https://lixiaobaivv.github.io/Codex-Skin-Store/submit/>
- Submission guide: <https://github.com/lixiaobaivv/Codex-Skin-Store/blob/main/docs/theme-submission.md>
- Client downloads: <https://github.com/lixiaobaivv/Codex-Skin/releases/latest>
- Client guide: <https://github.com/lixiaobaivv/Codex-Skin/blob/main/README.en.md>

> This is a community project, not an OpenAI or official Codex product. The website cannot read Codex credentials, API keys, projects, tasks, or conversations.

## Get Started

1. Install the Codex-Skin client for your system.
2. Open Codex-Skin once so the operating system registers its import handler.
3. Visit the storefront and select a theme.
4. Choose one-click import.
5. Review the source, version, and exact size in the client.
6. After verification, decide whether to restart Codex and apply the theme.

Use `Codex-Skin-Setup-win-x64.exe` on Windows. On macOS, use `Codex-Skin-osx-arm64.pkg` for Apple Silicon or `Codex-Skin-osx-x64.pkg` for Intel. The current packages are unsigned and not notarized, so Windows SmartScreen or macOS Gatekeeper may ask for explicit approval.

## One-Click Import

Windows is distributed only as `Codex-Skin-Setup-win-x64.exe`. Setup registers `dreamskin://` and `.dreamskin` automatically; portable EXE and ZIP downloads are not published.

The macOS PKG declares the same URL scheme and document type. Open `Codex-Skin.app` once after installation so LaunchServices can finish registration.

The web page only starts a request. The client asks before downloading, verifies the exact size, SHA-256, Ed25519 signature, closed manifest, platform support, and image files, installs atomically, then asks separately before applying. A click can never silently install or activate a theme.

If Codex-Skin is already running, one-click import activates that window and performs confirmation and progress there. A new window is created only when no client instance is running.

## Faster GitHub Downloads

If GitHub Releases are slow, prepend a mirror to the original address:

```text
https://github.com/lixiaobaivv/Codex-Skin/releases/latest/download/Codex-Skin-Setup-win-x64.exe
https://ghfast.top/https://github.com/lixiaobaivv/Codex-Skin/releases/latest/download/Codex-Skin-Setup-win-x64.exe
https://gh-proxy.com/https://github.com/lixiaobaivv/Codex-Skin/releases/latest/download/Codex-Skin-Setup-win-x64.exe
```

Mirrors are third-party services and may be unavailable or return stale content. Verify installer downloads against `Codex-Skin-installers-SHA256SUMS.txt` from the same Release. For one-click theme imports, the client reports the download state and final result while safely retrying the selected transport, direct GitHub, and built-in mirrors; exact size, SHA-256, and Ed25519 checks still apply to every result.

Desktop catalog sync uses the generated, content-addressed `desktop-catalog-v2.json` feed. The client conditionally requests this lightweight index, lazily downloads visible previews, and fetches complete theme assets only before application. It starts with the last successful transport or the user's selection, then falls back across direct GitHub and the remaining built-in mirrors.

## What Themes Can Change

Themes may change backgrounds, fixed sidebar styling, the masthead, logo, home guidance, four prompt cards, message bubbles, composer styling, and an optional pet image.

Themes cannot replace user projects, tasks, progress, conversations, account data, or Codex behavior. Prompt cards only insert their configured text into the real Codex composer.

## Troubleshooting

**One-click import does nothing:** open Codex-Skin once; repair Windows Setup registration; on macOS, confirm that you installed the latest PKG.

**Signature or hash validation fails:** do not continue. Download the theme again from the store and report the theme name, version, and client error code if it still fails.

**An imported theme was not applied:** installation and application are intentionally separate confirmations. Select the verified theme in Codex-Skin and choose **Apply and restart Codex**.

## Privacy And Safety

- The storefront is static GitHub Pages and requires no account.
- It does not probe the local client or connect to local CDP.
- The workshop creates the ZIP locally in the browser and does not upload drafts or images before the author submits them to GitHub.
- Theme packages cannot contain JavaScript, HTML, CSS, SVG, shell scripts, executables, symlinks, or undeclared files.
- The desktop client is the final verification and consent boundary.

## Create And Submit A Theme

Anyone can use the [online Theme Workshop](https://lixiaobaivv.github.io/Codex-Skin-Store/submit/) without forking the repository, installing Node.js or Rust, writing JSON, maintaining indexes, calculating hashes, or handling a signing key.

1. Enter the theme name, stable English ID, author, and asset license details.
2. Tune the colors and home-page copy while checking the live preview.
3. Upload a real PNG screenshot from Codex and an optional background.
4. Generate `codex-skin-submission-<theme-id>-1.0.0.zip`.
5. Open the GitHub submission form and attach the ZIP under **Standard submission bundle**.

Text fields are saved in the current browser. Images are not persisted and must be selected again after a page reload. The generated ZIP contains the desktop manifest, a `package: null` storefront draft, matching client and web previews, the optional background, and `SUBMISSION.md` license notes.

Submitting the form does not publish the theme immediately. A maintainer reviews the real preview, readability, ID conflicts, and asset rights, then converts the bundle into a review PR. Actions validate the closed schemas and catalog structure. After approval, trusted CI builds and signs `.dreamskin` from the exact Store commit, verifies it on Windows and macOS, fills in the version, download URL, size, and SHA-256, and updates both the storefront and lightweight desktop catalog.

Advanced authors who need custom logos, pets, four prompt cards, fonts, or complete copy control can still use the repository PR workflow in the [theme submission guide](docs/theme-submission.md). Both submission paths accept only declarative theme data and allowed images—never arbitrary CSS, JavaScript, HTML, SVG, scripts, or executables.

Storefront and catalog issues belong in [Codex-Skin-Store Issues](https://github.com/lixiaobaivv/Codex-Skin-Store/issues). Build and contribution details remain in [CONTRIBUTING.md](CONTRIBUTING.md); normal users do not need Node.js or a source checkout.
