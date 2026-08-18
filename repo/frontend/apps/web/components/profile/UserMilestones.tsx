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
      <div className="group relative overflow-hidden rounded-2xl bg-content/5 p-6 backdrop-blur-md transition-colors hover:bg-content/10">
        <div className="absolute -top-4 -right-4 size-24 rounded-full bg-linear-to-br from-warning/20 to-warning/5 blur-2xl transition-transform group-hover:scale-150" />
        <div className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-warning/10 text-warning">
            <Trophy size={24} />
          </div>
          <div>
            <div className="text-sm font-medium text-content/50">
              {t("profile.stats.level") || "等级"}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-content">Lv.{userInfo.level || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Listen Songs Card */}
      <div className="group relative overflow-hidden rounded-2xl bg-content/5 p-6 backdrop-blur-md transition-colors hover:bg-content/10">
        <div className="absolute -top-4 -right-4 size-24 rounded-full bg-linear-to-br from-info/20 to-info/5 blur-2xl transition-transform group-hover:scale-150" />
        <div className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-info/10 text-info">
            <Headphones size={24} />
          </div>
          <div>
            <div className="text-sm font-medium text-content/50">
              {t("profile.stats.listenSongs") || "累计听歌"}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-content">
                {userInfo.listenSongs?.toLocaleString() || 0}
              </span>
              <span className="text-xs text-content/40">首</span>
            </div>
          </div>
        </div>
      </div>

      {/* Create Days Card */}
      <div className="group relative overflow-hidden rounded-2xl bg-content/5 p-6 backdrop-blur-md transition-colors hover:bg-content/10">
        <div className="absolute -top-4 -right-4 size-24 rounded-full bg-linear-to-br from-success/20 to-success/5 blur-2xl transition-transform group-hover:scale-150" />
        <div className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
            <Calendar size={24} />
          </div>
          <div>
            <div className="text-sm font-medium text-content/50">
              {t("profile.stats.createDays") || "入村陪伴"}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-content">{formattedAge || "0 天"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
