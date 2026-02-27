import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  assetPrefix: "./",  // ← これが重要！相対パスで読み込む
  /*reactCompiler: true,*/
};

export default nextConfig;
