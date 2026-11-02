import { HomeProvider } from "./_components/HomeProvider";
import { AppBackground } from "@/components/shared/AppBackground";

/** 首页：外壳与间距在这里，各栏目是独立的 slot，按顺序摆放，各自失败、各自重试。 */
export default function HomeLayout({
  banners,
  artists,
  greeting,
  playlists,
  releases,
  toplists,
  voices,
}: {
  children: React.ReactNode;
  banners: React.ReactNode;
  artists: React.ReactNode;
  greeting: React.ReactNode;
  playlists: React.ReactNode;
  releases: React.ReactNode;
  toplists: React.ReactNode;
  voices: React.ReactNode;
}) {
  return (
    <HomeProvider>
      <div className="relative min-h-screen bg-surface-raised pb-24 font-sans">
        <AppBackground />
        <div className="relative z-10 mx-auto w-full max-w-400 space-y-7 px-4 py-6 sm:px-6">
          {greeting}
          {playlists}
          {artists}
          {releases}
          {voices}
          {banners}
          {toplists}
        </div>
      </div>
    </HomeProvider>
  );
}
