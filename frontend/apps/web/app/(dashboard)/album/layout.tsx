import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "专辑",
  description: "浏览专辑详情与曲目列表",
};

export default function AlbumLayout({ children }: { children: React.ReactNode }) {
  return children;
}
