import { Play } from "lucide-react";
import Image from "next/image";
import { useI18n } from "@/store/module/i18n";
import type { UserPlaylist } from "@/types/profile";

interface Props {
  playlists: UserPlaylist[];
  onClickPlaylist: (id: number) => void;
}

export function PublicPlaylistGrid({ playlists, onClickPlaylist }: Props) {
  const { t } = useI18n();
  console.log("Public playlists:", playlists);

  if (playlists.length === 0) {
    return <div className="text-sm text-content-muted">{t("profile.page.noPublicPlaylists")}</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {playlists.map((playlist, index) => (
        <div
          key={`${playlist.id}-${index}`}
          className="group cursor-pointer rounded-md bg-surface-elevated p-4 transition duration-300 hover:bg-surface-overlay"
          onClick={() => onClickPlaylist(playlist.id)}
        >
          <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-md shadow-panel">
            <Image
              width={300}
              height={300}
              src={playlist.coverImgUrl ? `${playlist.coverImgUrl}?param=300y300` : ""}
              alt={playlist.name}
              className="size-full object-cover"
            />
            <div className="absolute right-2 bottom-2 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              <button
                className="flex size-12 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-brand hover:scale-105 hover:bg-brand-hover"
                onClick={(e) => {
                  e.stopPropagation();
                  onClickPlaylist(playlist.id);
                }}
              >
                <Play size={24} fill="currentColor" stroke="currentColor" className="ml-1" />
              </button>
            </div>
          </div>
          <h3 className="mb-1 truncate font-bold text-content" title={playlist.name}>
            {playlist.name}
          </h3>
          <p className="truncate text-sm text-content-muted">
            {t("profile.page.playlistSongCount", { count: playlist.trackCount })}
          </p>
        </div>
      ))}
    </div>
  );
}
