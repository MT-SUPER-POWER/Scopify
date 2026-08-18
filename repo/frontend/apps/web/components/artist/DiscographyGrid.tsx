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
    <div className="my-12 px-6 md:px-8">
      <h2 className="mb-4 text-2xl font-bold">{t("artist.discography.title")}</h2>
      {albums.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-6 lg:grid-cols-5">
          {albums.map((album) => (
            <div
              key={album.id}
              className="group cursor-pointer rounded-lg bg-surface-elevated p-4 transition-colors hover:bg-surface-overlay"
              onClick={() => onClickAlbum(album.id)}
            >
              <div className="relative mb-4 pb-[100%]">
                <Image
                  src={album.coverUrl}
                  alt={album.title}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  className="rounded-md object-cover shadow-panel"
                />
                <button
                  type="button"
                  onClick={(e) => onPlayAlbum(album, e)}
                  className="absolute right-2 bottom-2 flex size-12 translate-y-2 items-center justify-center rounded-full bg-brand text-brand-foreground opacity-0 shadow-brand transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:scale-105 hover:bg-brand-hover"
                >
                  {loadingAlbumId === album.id ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <Play className="ml-1 size-5 fill-current" />
                  )}
                </button>
              </div>
              <h3 className="mb-1 truncate font-bold text-content" title={album.title}>
                {album.title}
              </h3>
              <p className="text-sm text-content-muted capitalize">
                {album.releaseYear} • {album.type}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-content-subtle">{t("artist.discography.noAlbums")}</div>
      )}
    </div>
  );
}
