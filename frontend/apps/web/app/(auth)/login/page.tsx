import type { Metadata } from "next";
import LoginPage from "@/components/auth/LoginPage";

export const metadata: Metadata = {
  title: "登录",
  description: "登录 Scopify，同步你的音乐库",
};

export default function Page() {
  return <LoginPage />;
}
