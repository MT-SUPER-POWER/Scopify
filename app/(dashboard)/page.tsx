import type { Metadata } from "next";
import HomePageComponent from "@/components/HomePage";

export const metadata: Metadata = {
  title: "首页",
  description: "发现音乐、推荐与每日精选",
};

export default function HomePageLayout() {
  return <HomePageComponent />;
}
