import type { Metadata } from "next";
import SettingsPage from "@/components/settings/SettingsPage";

export const metadata: Metadata = {
  title: "设置",
  description: "应用设置与偏好配置",
};

export default function Page() {
  return <SettingsPage />;
}
