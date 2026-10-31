"use client";

import { useSearchParams } from "next/navigation";
import { DailyCategoryPage } from "@/components/Playlist/DailyCategoryPage";
import { PlaylistDetail } from "./_components/PlaylistDetail";

export default function PlaylistPage() {
  const params = useSearchParams();
  if (params.get("dailyCategory") === "true") return <DailyCategoryPage />;
  return <PlaylistDetail />;
}
