import type { Metadata } from "next";
import { CacheCleanupPage } from "./_components/CacheCleanupPage";

export const metadata: Metadata = {
  title: "缓存管理",
  description: "管理 Scopify 页面和播放数据缓存",
};

export default function CachePage() {
  return <CacheCleanupPage />;
}
