import Image from "next/image";

import { UserHeroMetadata } from "@/components/profile/UserHeroMetadata";
import { UserHeroStats } from "@/components/profile/UserHeroStats";
import { UserVipBadge } from "@/components/shared/UserVipBadge";
import type { UserHeroProps } from "@/types/components/profile";

export function UserHero({ userInfo, playlistCount }: UserHeroProps) {
  return (
    <div className="relative z-10 flex flex-col items-start gap-6 px-6 pt-24 pb-6 md:flex-row">
      <div className="hover:scale-1.02 size-48 shrink-0 overflow-hidden rounded-full bg-surface-elevated shadow-floating transition-transform duration-300 lg:size-56">
        <Image
          width={224}
          height={224}
          src={userInfo.avatarUrl || "https://picsum.photos/seed/profile/400/400"}
          alt={userInfo.nickname}
          className="size-full object-cover"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col pt-1 text-content md:pt-2">
        <UserHeroMetadata userInfo={userInfo} />
        <div className="mb-2 flex min-w-0 items-center gap-3 md:mb-4">
          <h1
            className="leading-1.1 m-0 line-clamp-2 min-w-0 text-5xl font-black tracking-tighter wrap-break-word md:text-6xl lg:text-7xl"
            title={userInfo.nickname}
          >
            {userInfo.nickname}
          </h1>
          <UserVipBadge
            vipType={userInfo.vipType}
            className="h-5 shrink-0 rounded-sm px-1.5 text-[11px] font-bold"
          />
        </div>

        {userInfo.signature ? (
          <p className="mb-4 text-sm font-medium text-content/50 italic md:mb-6">
            “{userInfo.signature}”
          </p>
        ) : (
          <div className="mb-4 md:mb-6" />
        )}
        <UserHeroStats playlistCount={playlistCount} userInfo={userInfo} />
      </div>
    </div>
  );
}
