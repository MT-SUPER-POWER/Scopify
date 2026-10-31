import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "登录",
  description: "登录 Scopify，同步你的音乐库",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-screen flex-col items-center justify-center overflow-hidden bg-surface p-4 text-content">
      {children}
    </div>
  );
}
