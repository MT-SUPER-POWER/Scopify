import Image from "next/image";
import Link from "next/link";
import React from "react";
import { PlayingIndicator } from "@scopify/ui/scopify/components/playing-indicator";
import { usePlayerStore } from "@/store";
import LibItemContextMenu from "./LibItemMenu";

// 定义组件真正需要的属性，与后端 API 结构解耦
interface LibraryItemProps {
  id: string | number;
  title: string;
  subtitle: string;
  coverImg: string;
  isCollapsed?: boolean;
}

export const LibraryItem = ({ id, title, subtitle, coverImg, isCollapsed }: LibraryItemProps) => {
  const href = `/playlist?id=${id}`;
  const storePlaylistId = usePlayerStore((s) => s.playlistId);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const isCurrentPlaylist = String(storePlaylistId) === String(id);

  if (isCollapsed) {
    return (
      <LibItemContextMenu playlistID={id}>
        <Link
          href={href}
          title={title}
          className="group flex h-14 w-full cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-content/10 active:scale-95"
        >
          <div className="relative size-12 overflow-hidden rounded-md shadow-panel transition-transform group-hover:scale-110">
            <Image
              width={48}
              height={48}
              src={coverImg}
              alt={title}
              className="size-full object-cover"
            />
            {isCurrentPlaylist && isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-media-overlay">
                <PlayingIndicator size={16} />
              </div>
            )}
          </div>
        </Link>
      </LibItemContextMenu>
    );
  }

  return (
    <LibItemContextMenu playlistID={id}>
      <Link
        href={href}
        title={title}
        className="group flex w-full min-w-0 cursor-pointer items-center gap-3 overflow-hidden rounded-md p-2 transition-colors hover:bg-content/10"
      >
        <div className="relative size-12 shrink-0 overflow-hidden rounded-md shadow-panel transition-transform group-hover:scale-105">
          <Image
            width={48}
            height={48}
            src={coverImg}
            alt={title}
            className="size-full object-cover"
          />
          {isCurrentPlaylist && isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-media-overlay">
              <PlayingIndicator size={16} />
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-base font-normal text-content group-hover:text-content">
            {title}
          </span>
          <span className="mt-0.5 truncate text-sm text-content-muted">{subtitle}</span>
        </div>
      </Link>
    </LibItemContextMenu>
  );
};

export default React.memo(LibraryItem);
