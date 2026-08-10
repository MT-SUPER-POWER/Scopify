import { Suspense } from "react";

import { DesktopWallpaperSpikeBackdrop } from "@/components/lyrics/prototypes/DesktopWallpaperSpikeBackdrop";
import { DesktopWallpaperSpikeStatus } from "@/components/lyrics/prototypes/DesktopWallpaperSpikeStatus";

/** PROTOTYPE: isolated renderer used only by the Windows desktop-host spike. */
export default function DesktopWallpaperSpikePage() {
  return (
    <main className="relative size-full overflow-hidden bg-transparent">
      <Suspense fallback={null}>
        <DesktopWallpaperSpikeBackdrop />
      </Suspense>
      <DesktopWallpaperSpikeStatus />
    </main>
  );
}
