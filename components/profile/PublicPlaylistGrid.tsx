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
    return <div className="text-sm text-gray-400">{t("profile.page.noPublicPlaylists")}</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {playlists.map((playlist, index) => (
        <div
          key={`${playlist.id}-${index}`}
          className="group cursor-pointer rounded-md bg-[#181818] p-4 transition duration-300 hover:bg-[#282828]"
          onClick={() => onClickPlaylist(playlist.id)}
        >
          <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-md shadow-lg">
            <Image
              width={300}
              height={300}
              src={playlist.coverImgUrl ? `${playlist.coverImgUrl}?param=300y300` : ""}
              alt={playlist.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute right-2 bottom-2 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              <button
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1ed760] shadow-xl hover:scale-105 hover:bg-[#1fdf64]"
                onClick={(e) => {
                  e.stopPropagation();
                  onClickPlaylist(playlist.id);
                }}
              >
                <Play size={24} fill="black" stroke="black" className="ml-1" />
              </button>
            </div>
          </div>
          <h3 className="mb-1 truncate font-bold text-white" title={playlist.name}>
            {playlist.name}
          </h3>
          <p className="truncate text-sm text-gray-400">
            {t("profile.page.playlistSongCount", { count: playlist.trackCount })}
          </p>
        </div>
      ))}
    </div>
  );
}
