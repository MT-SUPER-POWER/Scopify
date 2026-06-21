import type { Metadata } from "next";
import MePage from "@/components/me/MePage";

export const metadata: Metadata = {
  title: "我的",
  description: "个人资料与音乐库",
};

export default function Page() {
  return <MePage />;
}
