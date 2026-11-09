import { HomeProvider } from "./_components/HomeProvider";
import { AppBackground } from "@/components/shared/AppBackground";
import { CapabilityGate } from "@/components/provider/CapabilityGate";

/**
 * 首页：外壳与间距在这里，各栏目是独立的 slot，按顺序摆放，各自失败、各自重试。
 * 有自带首页推荐的平台（recommend.feed）先显示它，取代问候与个性化歌单；其余栏目照旧。
 * 平台没有的栏目由 CapabilityGate 挡住：不渲染，也不发请求。playlists 与 releases 内含多个栏目，
 * 在各自 slot 里按能力再分。
 */
export default function HomeLayout({
  banners,
  feed,
  artists,
  greeting,
  playlists,
  releases,
  toplists,
  voices,
}: {
  children: React.ReactNode;
  banners: React.ReactNode;
  feed: React.ReactNode;
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
          <CapabilityGate
            requires="recommend.feed"
            fallback={
              <>
                <CapabilityGate requires="recommend.playlists">{greeting}</CapabilityGate>
                {playlists}
              </>
            }
          >
            {feed}
          </CapabilityGate>
          <CapabilityGate requires="recommend.artists">{artists}</CapabilityGate>
          {releases}
          <CapabilityGate requires="podcast">{voices}</CapabilityGate>
          <CapabilityGate requires="home.banners">{banners}</CapabilityGate>
          <CapabilityGate requires="recommend.toplists">{toplists}</CapabilityGate>
        </div>
      </div>
    </HomeProvider>
  );
}
