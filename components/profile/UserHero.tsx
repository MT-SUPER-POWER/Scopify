import Image from "next/image";
import type { NeteaseUser } from "@/types/api/user";

interface Props {
  userInfo: NeteaseUser;
  playlistCount: number;
}

export function UserHero({ userInfo, playlistCount }: Props) {
  return (
    <div className="relative z-10 flex flex-col items-start gap-6 px-6 pt-24 pb-6 md:flex-row">
      {/* 头像 */}
      <div className="h-48 w-48 shrink-0 overflow-hidden rounded-full bg-black/20 shadow-[0_8px_40px_rgba(0,0,0,0.5)] transition-transform duration-300 hover:scale-[1.02] lg:h-56 lg:w-56">
        <Image
          width={224}
          height={224}
          src={userInfo.avatarUrl || "https://picsum.photos/seed/profile/400/400"}
          alt={userInfo.nickname}
          className="h-full w-full object-cover"
        />
      </div>

      {/* 信息区 */}
      <div className="flex min-w-0 flex-1 flex-col pt-1 text-white md:pt-2">
        {/* 标签 */}
        <div className="mb-3 flex flex-row flex-wrap items-center gap-2 md:mb-4">
          <span className="rounded-sm bg-white/10 px-3 py-1 text-sm tracking-wider uppercase drop-shadow-md">
            Profile
          </span>
        </div>

        {/* 昵称 */}
        <h1
          className="m-0 mb-2 line-clamp-3 text-4xl leading-[1.1] font-black tracking-tighter wrap-break-word drop-shadow-lg md:text-5xl lg:text-6xl"
          title={userInfo.nickname}
        >
          {userInfo.nickname}
        </h1>

        {/* 签名：紧跟名字，作为副标题而非脚注 */}
        {userInfo.signature && (
          <p className="mb-4 line-clamp-1 text-sm text-white/50 md:mb-6">{userInfo.signature}</p>
        )}
        {/* 无签名时保持原有间距 */}
        {!userInfo.signature && <div className="mb-4 md:mb-6" />}

        {/* 元数据 */}
        <div className="flex flex-wrap items-center gap-2.5 text-sm text-white/80 drop-shadow-md">
          <span>
            <span className="font-semibold text-white">{userInfo.followeds.toLocaleString()}</span>{" "}
            Followers
          </span>
          <span className="opacity-60">•</span>
          <span>
            <span className="font-semibold text-white">{userInfo.follows.toLocaleString()}</span>{" "}
            Following
          </span>
          {playlistCount > 0 && (
            <>
              <span className="opacity-60">•</span>
              <span className="font-medium text-white">{playlistCount} Public Playlists</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
