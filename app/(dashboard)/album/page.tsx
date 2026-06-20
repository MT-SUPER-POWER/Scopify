import type { Metadata } from "next";
import AlbumPage from "@/components/album/AlbumPage";

export const metadata: Metadata = {
  title: "专辑",
  description: "浏览专辑详情与曲目列表",
};

export default function Page() {
  return <AlbumPage />;
}
