import Image from "next/image";
import { NeteaseUser } from "@/types/api/user";

interface Props {
  userInfo: NeteaseUser;
  playlistCount: number;
}

export function UserHero({ userInfo, playlistCount }: Props) {
  return (
    <div className="relative z-10 flex flex-col md:flex-row items-start gap-6 px-6 pt-24 pb-6">

      {/* 头像 */}
      <div className="w-48 h-48 lg:w-56 lg:h-56 shrink-0 transition-transform duration-300 hover:scale-[1.02]
          shadow-[0_8px_40px_rgba(0,0,0,0.5)] rounded-full overflow-hidden bg-black/20">
        <Image
          width={224} height={224}
          src={userInfo.avatarUrl || "https://picsum.photos/seed/profile/400/400"}
          alt={userInfo.nickname}
          className="w-full h-full object-cover"
        />
      </div>

      {/* 信息区 */}
      <div className="flex flex-col flex-1 min-w-0 text-white pt-1 md:pt-2">

        {/* 标签 */}
        <div className="flex flex-row gap-2 flex-wrap items-center mb-3 md:mb-4">
          <span className="text-sm drop-shadow-md uppercase tracking-wider bg-white/10 px-3 py-1 rounded-sm">
            Profile
          </span>
        </div>

        {/* 昵称 */}
        <h1
          className="m-0 font-black tracking-tighter leading-[1.1] drop-shadow-lg mb-2
          wrap-break-word text-4xl md:text-5xl lg:text-6xl line-clamp-3"
          title={userInfo.nickname}
        >
          {userInfo.nickname}
        </h1>

        {/* 签名：紧跟名字，作为副标题而非脚注 */}
        {userInfo.signature && (
          <p className="text-sm text-white/50 mb-4 md:mb-6 line-clamp-1">
            {userInfo.signature}
          </p>
        )}
        {/* 无签名时保持原有间距 */}
        {!userInfo.signature && <div className="mb-4 md:mb-6" />}

        {/* 元数据 */}
        <div className="flex flex-wrap items-center gap-2.5 text-sm text-white/80 drop-shadow-md">
          <span>
            <span className="text-white font-semibold">{userInfo.followeds.toLocaleString()}</span>
            {" "}Followers
          </span>
          <span className="opacity-60">•</span>
          <span>
            <span className="text-white font-semibold">{userInfo.follows.toLocaleString()}</span>
            {" "}Following
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
