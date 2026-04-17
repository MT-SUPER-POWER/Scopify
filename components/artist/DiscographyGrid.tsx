import { Loader2, Play } from "lucide-react";
import Image from "next/image";
import { useI18n } from "@/store/module/i18n";
import type { Album } from "@/types/artist";

interface Props {
  albums: Album[];
  loadingAlbumId: string | number | null;
  onPlayAlbum: (album: Album, e: React.MouseEvent) => void;
  onClickAlbum: (id: string | number) => void;
}

export function DiscographyGrid({ albums, loadingAlbumId, onPlayAlbum, onClickAlbum }: Props) {
  const { t } = useI18n();

  return (
    <div className="px-6 md:px-8 mt-12 mb-12">
      <h2 className="text-2xl font-bold mb-4">{t("artist.discography.title")}</h2>
      {albums.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {albums.map((album) => (
            <div
              key={album.id}
              className="bg-[#181818] hover:bg-[#282828] p-4 rounded-lg cursor-pointer transition-colors group"
              onClick={() => onClickAlbum(album.id)}
            >
              <div className="relative mb-4 pb-[100%]">
                <Image
                  src={album.coverUrl}
                  alt={album.title}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  className="object-cover rounded-md shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
                />
                <button
                  type="button"
                  onClick={(e) => onPlayAlbum(album, e)}
                  className="absolute bottom-2 right-2 w-12 h-12 bg-[#1DB954] rounded-full flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-lg shadow-black/40 hover:scale-105 hover:bg-[#1ed760]"
                >
                  {loadingAlbumId === album.id ? (
                    <Loader2 className="w-5 h-5 text-black animate-spin" />
                  ) : (
                    <Play className="w-5 h-5 text-black fill-black ml-1" />
                  )}
                </button>
              </div>
              <h3 className="font-bold text-white truncate mb-1" title={album.title}>
                {album.title}
              </h3>
              <p className="text-sm text-gray-400 capitalize">
                {album.releaseYear} • {album.type}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-zinc-500 text-sm">{t("artist.discography.noAlbums")}</div>
      )}
    </div>
  );
}
