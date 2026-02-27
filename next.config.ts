import type { NextConfig } from "next";

const isElectron = process.env.BUILD_TARGET === "electron";

const nextConfig: NextConfig = {
  output: isElectron ? "export" : undefined,
  trailingSlash: isElectron ? true : false,
  images: { unoptimized: true },
  assetPrefix: isElectron ? "./" : undefined,
};

export default nextConfig;