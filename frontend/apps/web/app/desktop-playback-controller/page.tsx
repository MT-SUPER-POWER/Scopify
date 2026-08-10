import type { Metadata } from "next";

import { DesktopPlaybackController } from "@/components/desktopWallpaper/DesktopPlaybackController";

export const metadata: Metadata = {
  title: "Scopify Desktop Music",
};

export default function DesktopPlaybackControllerPage() {
  return (
    <div className="size-full bg-[#0b0c10]">
      <DesktopPlaybackController />
    </div>
  );
}
