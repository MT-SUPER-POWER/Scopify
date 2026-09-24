import type { Metadata } from "next";
import { LoginDevices } from "@/components/devices/LoginDevices";
export const metadata: Metadata = {
  title: "登录设备 · Scopify",
  description: "管理登录设备与最近活动",
};
export default function LoginDevicesPage() {
  return (
    <main>
      <LoginDevices />
    </main>
  );
}
