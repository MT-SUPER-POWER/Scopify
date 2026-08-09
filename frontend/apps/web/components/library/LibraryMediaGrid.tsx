import { Clock, Disc3 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import type { LibraryMediaItem } from "@/types/library";

interface LibraryMediaGridProps {
  items: LibraryMediaItem[];
}

function LibraryMediaTile({ item }: { item: LibraryMediaItem }) {
  const media = (
    <>
      <div
        className={`bg-surface-elevated aspect-square overflow-hidden ${item.isArtist ? "rounded-full" : "rounded-md"}`}
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
          <div className="text-content-subtle flex size-full items-center justify-center">
            <Disc3 className="size-8" />
          </div>
        )}
      </div>
      <h2 className="text-content mt-3 truncate text-sm font-semibold">{item.title}</h2>
      {item.subtitle && <p className="text-content-muted mt-1 truncate text-xs">{item.subtitle}</p>}
      {item.date ? (
        <p className="text-content-subtle mt-1 flex items-center gap-1 truncate text-xs">
          <Clock className="size-3 shrink-0" />
          {formatDate(item.date)}
        </p>
      ) : null}
    </>
  );

  const className = "group hover:bg-content/5 min-w-0 rounded-md p-3 transition-colors";
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
