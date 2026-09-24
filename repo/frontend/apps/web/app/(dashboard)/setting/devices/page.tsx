import type { Metadata } from "next";
import { LoginDevicesHeader } from "@/components/devices/LoginDevicesHeader";
import { LoginDevicesPreview } from "@/components/devices/LoginDevicesPreview";
import styles from "@/components/devices/LoginDevices.module.css";

export const metadata: Metadata = {
  title: "登录设备 · Scopify",
  description: "登录设备管理页面设计预览",
};

export default function LoginDevicesPage() {
  return (
    <div className={styles.page}>
      <LoginDevicesHeader />
      <LoginDevicesPreview />
    </div>
  );
}
