import type { NextConfig } from "next";

const isPagesBuild = process.env.BUILD_GITHUB_PAGES === "true";
const pagesBasePath = isPagesBuild
  ? "/Codex-Skin-Store"
  : "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: pagesBasePath,
  assetPrefix: pagesBasePath || undefined,
  images: { unoptimized: true },
  typescript: isPagesBuild
    ? { tsconfigPath: "tsconfig.pages.json" }
    : undefined,
};

export default nextConfig;
