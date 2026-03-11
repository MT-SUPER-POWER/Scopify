import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 静态导出，供 Electron 打包后加载
  output: "export",
  // Next.js 静态文件输出到 renderer/ 目录，与 Electron main 的 out/ 分开
  distDir: "renderer",
  // 解决打包之后使用 Link 导致的一些报错问题 (Dev Tools 可见)
  trailingSlash: true,
  env: {
    BACKEND_URL: "http://127.0.0.1:3838",
    BACKEND_DEFAULT_PORT: "3838",
    AXIOS_TIMEOUT: "5000",
    NEXT_PORT: "3000",
    MAX_RETRIES: "1",
    RETRY_DELAY: "500",
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: [],
  // @ts-ignore - Next.js 15+ 移入顶层的配置
  allowedDevOrigins: ["192.168.3.8", "localhost", "127.0.0.1", "_next"],
};

export default nextConfig;
