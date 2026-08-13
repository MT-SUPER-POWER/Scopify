import type { Metadata } from "next";

import { PlaybackHostRoot } from "@/components/player/PlaybackHostRoot";

/** The intentionally headless renderer entry point for the dedicated Playback Host window. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Playback Host",
};

export default function PlaybackHostPage() {
  return <PlaybackHostRoot />;
}
