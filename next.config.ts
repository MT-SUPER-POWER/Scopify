import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // FIX：移除 output: "export"，改为由 next-electron-server 提供本地文件服务支持
  // output: "export",
  env: {
    "BACKEND_URL": "http://192.168.3.8:31212",
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
