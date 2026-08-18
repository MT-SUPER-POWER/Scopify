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
        className={`aspect-square overflow-hidden bg-surface-elevated ${item.isArtist ? "rounded-full" : "rounded-md"}`}
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
          <div className="flex size-full items-center justify-center text-content-subtle">
            <Disc3 className="size-8" />
          </div>
        )}
      </div>
      <h2 className="mt-3 truncate text-sm font-semibold text-content">{item.title}</h2>
      {item.subtitle && <p className="mt-1 truncate text-xs text-content-muted">{item.subtitle}</p>}
      {item.date ? (
        <p className="mt-1 flex items-center gap-1 truncate text-xs text-content-subtle">
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
