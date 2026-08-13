import type { Metadata } from "next";
import { CacheCleanupSettingsScreen } from "@/components/cache/CacheCleanupSettingsScreen";

export const metadata: Metadata = {
  title: "缓存管理",
  description: "管理 Scopify 页面和播放数据缓存",
};

export default function CachePage() {
  return <CacheCleanupSettingsScreen />;
}
