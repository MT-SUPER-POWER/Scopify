"use client";

import Link from "next/link";
import { NowPlayingFollowButton } from "./NowPlayingFollowButton";
import { useArtistFollow } from "@/hooks/artist/useArtistFollow";
import type { NowPlayingCreditRowProps } from "@/types/player/nowPlayingComponents";

/** 演职人员中的一位艺人：名字、身份与关注按钮。 */
export function NowPlayingCreditRow({ artist, role }: NowPlayingCreditRowProps) {
  const follow = useArtistFollow(artist.id);

  return (
    <li className="flex items-center justify-between gap-3 px-4">
      <div className="min-w-0">
        <Link
          href={`/artist?id=${artist.id}`}
          scroll={false}
          className="block truncate text-sm font-bold text-content hover:underline"
        >
          {artist.name}
        </Link>
        <p className="mt-0.5 truncate text-xs text-content-muted">{role}</p>
      </div>
      <NowPlayingFollowButton follow={follow} />
    </li>
  );
}
