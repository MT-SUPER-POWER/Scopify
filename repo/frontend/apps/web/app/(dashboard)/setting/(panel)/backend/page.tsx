import type { Metadata } from "next";
import { BackendSettingsPage } from "./_components/BackendSettingsPage";

export const metadata: Metadata = {
  title: "后端服务",
  description: "管理网易云音乐与 QQ 音乐的后端地址与请求选项",
};

export default function BackendPage() {
  return <BackendSettingsPage />;
}
