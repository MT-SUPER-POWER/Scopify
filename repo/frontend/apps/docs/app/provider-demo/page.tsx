import type { Metadata } from "next";
import { ProviderDemo } from "./_components/provider-demo";

export const metadata: Metadata = {
  title: "多平台类型拆分 Demo",
  description: "验证共享曲目、账号资产和界面类型的独立边界。",
};

export default function ProviderDemoRoute() {
  return <ProviderDemo />;
}
