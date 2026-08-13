import { DesktopPlaybackWallpaperRenderer } from "@/components/desktopWallpaper/DesktopPlaybackWallpaperRenderer";

export default function DesktopPlaybackWallpaperPage() {
  return (
    <main
      data-desktop-playback-wallpaper-root
      className="relative h-screen w-screen overflow-hidden bg-transparent"
    >
      <DesktopPlaybackWallpaperRenderer />
    </main>
  );
}
