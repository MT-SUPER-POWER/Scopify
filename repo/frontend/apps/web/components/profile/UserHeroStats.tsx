import { Activity, Clock3, Disc3, Headphones, Trophy, Users } from "lucide-react";

import { formatListeningDuration } from "@/lib/listeningReport/normalize";
import { useI18n } from "@/store/module/i18n";
import type { UserHeroStatsProps } from "@/types/components/profile";

export function UserHeroStats({ playlistCount, userInfo }: UserHeroStatsProps) {
  const { t } = useI18n();

  return (
    <div className="flex flex-wrap items-center gap-4 text-sm text-content/70">
      <span className="flex items-center gap-1.5">
        <Users size={16} className="text-content/50" />
        <span className="font-semibold text-content">{userInfo.follows.toLocaleString()}</span>
        <span className="ml-0.5">{t("profile.hero.follows")}</span>
      </span>
      <span className="flex items-center gap-1.5">
        <Users size={16} className="text-content/50" />
        <span className="font-semibold text-content">{userInfo.followeds.toLocaleString()}</span>
        <span className="ml-0.5">{t("profile.hero.followers")}</span>
      </span>
      <span className="flex items-center gap-1.5">
        <Disc3 size={16} className="text-content/50" />
        <span className="font-semibold text-content">
          {userInfo.playlistCount ?? playlistCount}
        </span>
        <span className="ml-0.5">{t("profile.hero.playlists")}</span>
      </span>
      {(userInfo.eventCount ?? 0) > 0 ? (
        <span className="flex items-center gap-1.5">
          <Activity size={16} className="text-content/50" />
          <span className="font-semibold text-content">{userInfo.eventCount}</span>
          <span className="ml-0.5">{t("profile.hero.events")}</span>
        </span>
      ) : null}
      {userInfo.level !== undefined ? (
        <span className="flex items-center gap-1.5">
          <Trophy size={16} className="text-content/50" />
          <span className="font-semibold text-content">Lv.{userInfo.level}</span>
        </span>
      ) : null}
      {userInfo.listenSongs !== undefined ? (
        <span className="flex items-center gap-1.5">
          <Headphones size={16} className="text-content/50" />
          <span className="ml-0.5 font-semibold text-content">
            {t("profile.hero.listenSongs", { count: userInfo.listenSongs.toLocaleString() })}
          </span>
        </span>
      ) : null}
      {userInfo.listenDurationSeconds !== undefined ? (
        <span className="flex items-center gap-1.5">
          <Clock3 size={16} className="text-content/50" />
          <span className="font-semibold text-content">
            {formatListeningDuration(userInfo.listenDurationSeconds)}
          </span>
        </span>
      ) : null}
    </div>
  );
}
