import { Calendar, Headphones, Trophy } from "lucide-react";
import type { NeteaseUser } from "@/types/api/user";
import { useI18n } from "@/store/module/i18n";

interface Props {
  userInfo: NeteaseUser;
}

export function UserMilestones({ userInfo }: Props) {
  const { t } = useI18n();

  // Helper to convert days to a more emotional format (Years and Months)
  const formatDays = (days?: number) => {
    if (!days) return null;
    const years = Math.floor(days / 365);
    const months = Math.floor((days % 365) / 30);

    if (years > 0) {
      return `${years} 年 ${months > 0 ? `${months} 个月` : ""} (${days} 天)`;
    }
    if (months > 0) {
      return `${months} 个月 (${days} 天)`;
    }
    return `${days} 天`;
  };

  const formattedAge = formatDays(userInfo.createDays);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* Level Card */}
      <div className="group relative overflow-hidden rounded-2xl bg-white/5 p-6 backdrop-blur-md transition-colors hover:bg-white/10">
        <div className="absolute -top-4 -right-4 size-24 rounded-full bg-linear-to-br from-yellow-400/20 to-orange-500/20 blur-2xl transition-transform group-hover:scale-150" />
        <div className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-500">
            <Trophy size={24} />
          </div>
          <div>
            <div className="text-sm font-medium text-white/50">
              {t("profile.stats.level") || "等级"}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-white">Lv.{userInfo.level || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Listen Songs Card */}
      <div className="group relative overflow-hidden rounded-2xl bg-white/5 p-6 backdrop-blur-md transition-colors hover:bg-white/10">
        <div className="absolute -top-4 -right-4 size-24 rounded-full bg-linear-to-br from-blue-400/20 to-cyan-500/20 blur-2xl transition-transform group-hover:scale-150" />
        <div className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
            <Headphones size={24} />
          </div>
          <div>
            <div className="text-sm font-medium text-white/50">
              {t("profile.stats.listenSongs") || "累计听歌"}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-white">
                {userInfo.listenSongs?.toLocaleString() || 0}
              </span>
              <span className="text-xs text-white/40">首</span>
            </div>
          </div>
        </div>
      </div>

      {/* Create Days Card */}
      <div className="group relative overflow-hidden rounded-2xl bg-white/5 p-6 backdrop-blur-md transition-colors hover:bg-white/10">
        <div className="absolute -top-4 -right-4 size-24 rounded-full bg-linear-to-br from-green-400/20 to-emerald-500/20 blur-2xl transition-transform group-hover:scale-150" />
        <div className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <Calendar size={24} />
          </div>
          <div>
            <div className="text-sm font-medium text-white/50">
              {t("profile.stats.createDays") || "入村陪伴"}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-white">{formattedAge || "0 天"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
