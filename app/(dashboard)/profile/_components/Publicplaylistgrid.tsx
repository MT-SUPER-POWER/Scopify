import { Play } from "lucide-react";
import Image from "next/image";
import { UserPlaylist } from "../_types";

interface Props {
  playlists: UserPlaylist[];
  onClickPlaylist: (id: number) => void;
}

export function PublicPlaylistGrid({ playlists, onClickPlaylist }: Props) {
  if (playlists.length === 0) {
    return <div className="text-gray-400 text-sm">No public playlists</div>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
      {playlists.map((playlist, index) => (
        <div
          key={`${playlist.id}-${index}`}
          className="bg-[#181818] p-4 rounded-md hover:bg-[#282828] transition duration-300 group cursor-pointer"
          onClick={() => onClickPlaylist(playlist.id)}
        >
          <div className="relative w-full aspect-square mb-4 shadow-lg rounded-md overflow-hidden">
            <Image
              width={300} height={300}
              src={playlist.coverImgUrl ? `${playlist.coverImgUrl}?param=300y300` : ""}
              alt={playlist.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 right-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
              <button
                className="w-12 h-12 bg-[#1ed760] rounded-full flex items-center justify-center shadow-xl hover:scale-105 hover:bg-[#1fdf64]"
                onClick={(e) => { e.stopPropagation(); onClickPlaylist(playlist.id); }}
              >
                <Play size={24} fill="black" stroke="black" className="ml-1" />
              </button>
            </div>
          </div>
          <h3 className="font-bold text-white truncate mb-1" title={playlist.name}>
            {playlist.name}
          </h3>
          <p className="text-sm text-gray-400 truncate">
            {playlist.trackCount} songs
          </p>
        </div>
      ))}
    </div>
  );
}
