import { ListMusic, Music2, Play } from "lucide-react";
import Image from "next/image";
import { formatRelativeTime } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { PublicPlaylistGridProps } from "@/types/components/profile";

export function PublicPlaylistGrid({ playlists, onClickPlaylist }: PublicPlaylistGridProps) {
  const { t } = useI18n();

  if (playlists.length === 0) {
    return <div className="text-sm text-content-muted">{t("profile.page.noPublicPlaylists")}</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {playlists.map((playlist, index) => {
        const relativeTime = formatRelativeTime(playlist.playTime);

        return (
          <div
            key={`${playlist.id}-${index}`}
            className="group cursor-pointer rounded-md bg-surface-elevated p-4 transition duration-300 hover:bg-surface-overlay"
            onClick={() => onClickPlaylist(playlist)}
          >
            <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-md shadow-panel">
              {playlist.coverImgUrl ? (
                <Image
                  width={300}
                  height={300}
                  src={`${playlist.coverImgUrl}?param=300y300`}
                  alt={playlist.name}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-brand/15 text-brand">
                  <ListMusic className="size-12" />
                </div>
              )}

              {/* 播放时间胶囊 Badge */}
              {relativeTime ? (
                <div className="bg-surface-base/80 absolute top-2 right-2 rounded-full px-2 py-0.5 text-[11px] font-medium text-content/90 shadow-sm backdrop-blur-md">
                  {relativeTime}
                </div>
              ) : null}

              <div className="absolute right-2 bottom-2 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                <button
                  className="flex size-12 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-brand hover:scale-105 hover:bg-brand-hover"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClickPlaylist(playlist);
                  }}
                >
                  <Play size={24} fill="currentColor" stroke="currentColor" className="ml-1" />
                </button>
              </div>
            </div>

            <h3 className="mb-1.5 truncate font-bold text-content" title={playlist.name}>
              {playlist.name}
            </h3>

            {(() => {
              // 1. 虚拟歌单（如最近播放歌曲集合）：显示歌曲总数
              if (playlist.isVirtual && playlist.trackCount > 0) {
                return (
                  <p className="truncate text-xs text-content-muted">
                    {t("profile.page.playlistSongCount", { count: playlist.trackCount })}
                  </p>
                );
              }

              // 2. 最近播放过具体单曲：展示上次播放的曲目及歌手名
              if (playlist.lastSong?.name) {
                const songLabel = `${playlist.lastSong.name}${playlist.lastSong.artists ? ` · ${playlist.lastSong.artists}` : ""}`;
                return (
                  <div
                    className="flex items-center gap-1.5 text-xs text-content-muted"
                    title={`上次播放: ${songLabel}`}
                  >
                    <Music2 size={13} className="shrink-0 text-brand" />
                    <span className="truncate">{songLabel}</span>
                  </div>
                );
              }

              // 3. 有创建者信息：展示创建者
              if (playlist.creator?.nickname) {
                return (
                  <p className="truncate text-xs text-content-muted">
                    {t("profile.page.byCreator", { name: playlist.creator.nickname })}
                  </p>
                );
              }

              // 4. 普通歌单曲目数
              if (playlist.trackCount > 0) {
                return (
                  <p className="truncate text-xs text-content-muted">
                    {t("profile.page.playlistSongCount", { count: playlist.trackCount })}
                  </p>
                );
              }

              return null;
            })()}
          </div>
        );
      })}
    </div>
  );
}
