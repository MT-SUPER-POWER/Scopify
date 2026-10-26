import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MV",
  description: "观看 MV 并浏览相似 MV",
};

export default function MvLayout({ children }: { children: React.ReactNode }) {
  return children;
}
