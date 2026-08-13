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
    return <div className="text-content-muted text-sm">{t("profile.page.noPublicPlaylists")}</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {playlists.map((playlist, index) => (
        <div
          key={`${playlist.id}-${index}`}
          className="bg-surface-elevated hover:bg-surface-overlay group cursor-pointer rounded-md p-4 transition duration-300"
          onClick={() => onClickPlaylist(playlist.id)}
        >
          <div className="shadow-panel relative mb-4 aspect-square w-full overflow-hidden rounded-md">
            <Image
              width={300}
              height={300}
              src={playlist.coverImgUrl ? `${playlist.coverImgUrl}?param=300y300` : ""}
              alt={playlist.name}
              className="size-full object-cover"
            />
            <div className="absolute right-2 bottom-2 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              <button
                className="bg-brand text-brand-foreground shadow-brand hover:bg-brand-hover flex size-12 items-center justify-center rounded-full hover:scale-105"
                onClick={(e) => {
                  e.stopPropagation();
                  onClickPlaylist(playlist.id);
                }}
              >
                <Play size={24} fill="currentColor" stroke="currentColor" className="ml-1" />
              </button>
            </div>
          </div>
          <h3 className="text-content mb-1 truncate font-bold" title={playlist.name}>
            {playlist.name}
          </h3>
          <p className="text-content-muted truncate text-sm">
            {t("profile.page.playlistSongCount", { count: playlist.trackCount })}
          </p>
        </div>
      ))}
    </div>
  );
}
