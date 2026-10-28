"use client";

import Image from "next/image";
import { useArtistDetailQuery } from "@/hooks/artist/useArtistQueries";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { cn } from "@/lib/utils";
import type { MvArtistAvatarProps } from "@/types/mv/components";

/**
 * MV 艺人的圆形头像。MV 列表接口不带头像，按艺人 id 取详情（公共缓存、跨卡片共享）；
 * 取不到时显示名字首字。
 */
export function MvArtistAvatar({ artistId, name, className }: MvArtistAvatarProps) {
  const artist = useArtistDetailQuery(artistId ? String(artistId) : null).data?.data?.artist;
  const avatar = artist?.avatar || artist?.cover;

  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-elevated text-xs font-bold text-content-muted",
        className,
      )}
    >
      {avatar ? (
        <Image
          fill
          sizes="48px"
          src={getSizedImageUrl(avatar, 120)}
          alt=""
          className="object-cover"
        />
      ) : (
        name.slice(0, 1)
      )}
    </span>
  );
}
