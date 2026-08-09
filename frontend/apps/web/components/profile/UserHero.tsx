import Image from "next/image";
import { Users, MapPin, CalendarDays, Activity, Trophy, Headphones, Disc3 } from "lucide-react";
import {
  IconZodiacAries,
  IconZodiacTaurus,
  IconZodiacGemini,
  IconZodiacCancer,
  IconZodiacLeo,
  IconZodiacVirgo,
  IconZodiacLibra,
  IconZodiacScorpio,
  IconZodiacSagittarius,
  IconZodiacCapricorn,
  IconZodiacAquarius,
  IconZodiacPisces,
} from "@tabler/icons-react";
import { UserVipBadge } from "@/components/shared/UserVipBadge";
import type { NeteaseUser } from "@/types/api/user";
import { useI18n } from "@/store/module/i18n";
import { getLocationName } from "@/constants/location";

interface Props {
  userInfo: NeteaseUser;
  playlistCount: number;
}

export function UserHero({ userInfo, playlistCount }: Props) {
  const { t } = useI18n();

  // Constellation helper
  const getZodiacSign = (dateTimestamp?: number) => {
    if (!dateTimestamp) return null;
    const date = new Date(dateTimestamp);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    if ((month === 1 && day <= 20) || (month === 12 && day >= 22))
      return { text: "摩羯座", Icon: IconZodiacCapricorn };
    if ((month === 1 && day >= 21) || (month === 2 && day <= 18))
      return { text: "水瓶座", Icon: IconZodiacAquarius };
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20))
      return { text: "双鱼座", Icon: IconZodiacPisces };
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19))
      return { text: "白羊座", Icon: IconZodiacAries };
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20))
      return { text: "金牛座", Icon: IconZodiacTaurus };
    if ((month === 5 && day >= 21) || (month === 6 && day <= 21))
      return { text: "双子座", Icon: IconZodiacGemini };
    if ((month === 6 && day >= 22) || (month === 7 && day <= 22))
      return { text: "巨蟹座", Icon: IconZodiacCancer };
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22))
      return { text: "狮子座", Icon: IconZodiacLeo };
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22))
      return { text: "处女座", Icon: IconZodiacVirgo };
    if ((month === 9 && day >= 23) || (month === 10 && day <= 23))
      return { text: "天秤座", Icon: IconZodiacLibra };
    if ((month === 10 && day >= 24) || (month === 11 && day <= 22))
      return { text: "天蝎座", Icon: IconZodiacScorpio };
    if ((month === 11 && day >= 23) || (month === 12 && day <= 21))
      return { text: "射手座", Icon: IconZodiacSagittarius };
    return null;
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "";
    const d = new Date(timestamp);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const zodiac = getZodiacSign(userInfo.birthday);
  const locationName = getLocationName(userInfo.province, userInfo.city);

  return (
    <div className="relative z-10 flex flex-col items-start gap-6 px-6 pt-24 pb-6 md:flex-row">
      {/* 头像 */}
      <div className="bg-surface-elevated hover:scale-1.02 shadow-floating size-48 shrink-0 overflow-hidden rounded-full transition-transform duration-300 lg:size-56">
        <Image
          width={224}
          height={224}
          src={userInfo.avatarUrl || "https://picsum.photos/seed/profile/400/400"}
          alt={userInfo.nickname}
          className="size-full object-cover"
        />
      </div>

      {/* 信息区 */}
      <div className="text-content flex min-w-0 flex-1 flex-col pt-1 md:pt-2">
        <div className="mb-2 flex flex-wrap items-center gap-2 md:mb-4">
          <span className="bg-content/10 text-content/90 rounded-sm px-3 py-1 text-sm tracking-wider uppercase">
            PROFILE
          </span>
          {locationName && (
            <span className="bg-content/10 text-content/90 flex items-center gap-1.5 rounded-sm px-3 py-1 text-[13px]">
              <MapPin size={14} />
              {locationName}
            </span>
          )}
          {zodiac && (
            <span className="bg-content/10 text-content/90 flex items-center gap-1.5 rounded-sm px-3 py-1 text-[13px]">
              <zodiac.Icon size={16} stroke={2.5} />
              {zodiac.text}
            </span>
          )}
          {userInfo.createTime && (
            <span className="bg-content/10 text-content/90 flex items-center gap-1.5 rounded-sm px-3 py-1 text-[13px]">
              <CalendarDays size={14} />
              {t("profile.hero.joined", { date: formatDate(userInfo.createTime) })}
            </span>
          )}
          <div className="flex scale-90 items-center justify-center">
            <UserVipBadge vipType={userInfo.vipType} />
          </div>
        </div>

        <div className="mb-2 flex min-w-0 items-center gap-3 md:mb-4">
          <h1
            className="leading-1.1 m-0 line-clamp-2 min-w-0 text-5xl font-black tracking-tighter wrap-break-word md:text-6xl lg:text-7xl"
            title={userInfo.nickname}
          >
            {userInfo.nickname}
          </h1>
        </div>

        {userInfo.signature && (
          <p className="text-content/50 mb-4 text-sm font-medium italic md:mb-6">
            “{userInfo.signature}”
          </p>
        )}
        {!userInfo.signature && <div className="mb-4 md:mb-6" />}

        <div className="text-content/70 flex flex-wrap items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <Users size={16} className="text-content/50" />
            <span className="text-content font-semibold">{userInfo.follows.toLocaleString()}</span>
            <span className="ml-0.5">{t("profile.hero.follows")}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Users size={16} className="text-content/50" />
            <span className="text-content font-semibold">
              {userInfo.followeds.toLocaleString()}
            </span>
            <span className="ml-0.5">{t("profile.hero.followers")}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Disc3 size={16} className="text-content/50" />
            <span className="text-content font-semibold">
              {userInfo.playlistCount ?? playlistCount}
            </span>
            <span className="ml-0.5">{t("profile.hero.playlists")}</span>
          </span>
          {(userInfo.eventCount ?? 0) > 0 && (
            <span className="flex items-center gap-1.5">
              <Activity size={16} className="text-content/50" />
              <span className="text-content font-semibold">{userInfo.eventCount}</span>
              <span className="ml-0.5">{t("profile.hero.events")}</span>
            </span>
          )}
          {userInfo.level !== undefined && (
            <span className="flex items-center gap-1.5">
              <Trophy size={16} className="text-content/50" />
              <span className="text-content font-semibold">Lv.{userInfo.level}</span>
            </span>
          )}
          {userInfo.listenSongs !== undefined && (
            <span className="flex items-center gap-1.5">
              <Headphones size={16} className="text-content/50" />
              <span className="text-content ml-0.5 font-semibold">
                {t("profile.hero.listenSongs", { count: userInfo.listenSongs.toLocaleString() })}
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
