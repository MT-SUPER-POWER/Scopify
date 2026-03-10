import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 静态导出，供 Electron 打包后加载
  output: "export",
  // Next.js 静态文件输出到 renderer/ 目录，与 Electron main 的 out/ 分开
  distDir: "renderer",
  env: {
    "BACKEND_URL": "http://192.168.3.8:31212",    // TODO: 生产环境记得换成具体的后端地址
    "AXIOS_TIMEOUT": "5000",
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: [],
  // @ts-ignore - Next.js 15+ 移入顶层的配置
  allowedDevOrigins: ["127.0.0.1", "localhost", "192.168.3.10", "192.168.3.8"],
};

export default nextConfig;
