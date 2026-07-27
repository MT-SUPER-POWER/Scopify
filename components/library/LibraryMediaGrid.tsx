import { Disc3 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { LibraryMediaItem } from "@/types/library";

interface LibraryMediaGridProps {
  items: LibraryMediaItem[];
}

function LibraryMediaTile({ item }: { item: LibraryMediaItem }) {
  const media = (
    <>
      <div
        className={`aspect-square overflow-hidden bg-zinc-800 ${item.isArtist ? "rounded-full" : "rounded-md"}`}
      >
        {item.coverUrl ? (
          <Image
            width={300}
            height={300}
            src={item.coverUrl}
            alt={item.title}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-zinc-500">
            <Disc3 className="size-8" />
          </div>
        )}
      </div>
      <h2 className="mt-3 truncate text-sm font-semibold text-white">{item.title}</h2>
      {item.subtitle && <p className="mt-1 truncate text-xs text-zinc-400">{item.subtitle}</p>}
    </>
  );

  const className = "group min-w-0 rounded-md p-3 transition-colors hover:bg-white/5";
  return item.href ? (
    <Link href={item.href} className={className}>
      {media}
    </Link>
  ) : (
    <article className={className}>{media}</article>
  );
}

export function LibraryMediaGrid({ items }: LibraryMediaGridProps) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {items.map((item) => (
        <LibraryMediaTile key={item.id} item={item} />
      ))}
    </div>
  );
}
