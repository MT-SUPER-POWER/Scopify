"use client";
import { Link2, ScrollText, User } from "lucide-react";
import Link from "next/link";
import { FaRegCommentDots } from "react-icons/fa6";
import {
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu";
import { getCommentHref } from "@/lib/comment/commentResource";
import { formatCompactCount } from "@/lib/utils";
import type { SongContextMenuSectionProps } from "@/types/components/songContextMenu";

export function SongNavigationMenuItems({ actions, model }: SongContextMenuSectionProps) {
  const { song, onViewTranscript } = actions;
  const { t, commentCount, handleCopyLink } = model;
  return (
    <>
      {onViewTranscript && (
        <ContextMenuItem onClick={onViewTranscript}>
          <ScrollText className="mr-2 size-4" />
          {t("search.voice.transcript")}
        </ContextMenuItem>
      )}

      <ContextMenuItem asChild className="w-full">
        <Link
          href={
            song.voiceId !== undefined
              ? getCommentHref("voice", song.voiceId)
              : getCommentHref("song", song.id)
          }
          className="block size-full"
        >
          <FaRegCommentDots className="mr-2 size-4" />
          {commentCount === undefined
            ? t("contextMenu.comments")
            : t("contextMenu.commentsWithCount", {
                count: formatCompactCount(commentCount),
              })}
        </Link>
      </ContextMenuItem>

      {song.ar &&
        song.ar.length > 0 &&
        (song.ar.length === 1 ? (
          <ContextMenuItem asChild className="w-full">
            <Link href={`/artist?id=${song.ar[0].id}`} className="block size-full">
              <User className="mr-2 size-4" />
              {t("contextMenu.goToArtist")}
            </Link>
          </ContextMenuItem>
        ) : (
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <User className="mr-4 size-4" />
              {t("contextMenu.goToArtist")}
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="z-9999">
              {song.ar.map((artist) => (
                <ContextMenuItem key={artist.id} asChild>
                  <Link href={`/artist?id=${artist.id}`} className="block size-full">
                    {artist.name}
                  </Link>
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
        ))}

      <ContextMenuItem asChild className="w-full">
        <button type="button" onClick={handleCopyLink} className="block size-full text-left">
          <Link2 className="mr-2 size-4" />
          {t("contextMenu.copyLink")}
        </button>
      </ContextMenuItem>
    </>
  );
}
