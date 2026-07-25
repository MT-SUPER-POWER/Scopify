import { CalendarDays, Check, Flame } from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { VipSignMenuCardProps } from "@/types/components/vipSign";

export function VipSignMenuCard({
  actionLabel,
  hasSignedToday,
  isLoading,
  isSigning,
  onAction,
  onSelectSignDay,
  signHistory,
}: VipSignMenuCardProps) {
  const { t } = useI18n();
  const recentRecords = useMemo(() => signHistory?.signInfoList.slice(-4) ?? [], [signHistory]);

  return (
    <section className="relative my-2 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] p-3 shadow-xs transition-all hover:border-white/20">
      {/* 顶部标题与奖励提示 */}
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <CalendarDays className="size-4 shrink-0 text-emerald-400" />
          <span className="truncate text-xs font-bold text-white">{t("profile.menu.vipSign")}</span>
        </div>
        {signHistory?.subText && (
          <span className="flex shrink-0 items-center gap-1 truncate text-[11px] text-zinc-400">
            <Flame className="size-3 text-amber-400" />
            {signHistory.subText}
          </span>
        )}
      </div>

      {/* 4天签到进度连线图 */}
      <div className="relative my-3 flex flex-col gap-1.5">
        {/* 日期 Label 行 */}
        <div className="flex w-full items-center justify-evenly text-center">
          {recentRecords.map((record) => (
            <span
              key={`label-${record.dayText}-${record.signTime}`}
              className={cn(
                "w-8 text-center text-[10px] font-medium transition-colors",
                record.today ? "font-bold text-emerald-400" : "text-zinc-400",
              )}
            >
              {record.today ? "今天" : record.dayText}
            </span>
          ))}
        </div>

        {/* 圆圈 Node 行（背景居中横线被实心节点遮挡） */}
        <div className="relative flex w-full items-center justify-evenly">
          {/* 背景居中虚线 - top-1/2 垂直精准对齐圆圈中心 */}
          <div className="pointer-events-none absolute inset-x-6 top-1/2 z-0 h-px -translate-y-1/2 border-t border-dashed border-white/25" />

          {recentRecords.map((record) => {
            const nodeElement = (
              <div
                className={cn(
                  "relative z-10 flex size-8 items-center justify-center rounded-full bg-[#1a1a1e] text-[10px] font-semibold shadow-xs transition-all",
                  record.sign
                    ? "border border-emerald-500/50 text-emerald-300 ring-2 ring-emerald-500/20"
                    : record.today
                      ? "animate-pulse border-2 border-emerald-400 text-emerald-300 ring-2 ring-emerald-500/20"
                      : "border border-white/20 text-zinc-400",
                )}
              >
                {record.sign && record.songCoverUrl ? (
                  <Image
                    fill
                    sizes="32px"
                    src={record.songCoverUrl}
                    alt=""
                    className="rounded-full object-cover"
                  />
                ) : record.today ? (
                  <span className="text-[11px] font-bold">今</span>
                ) : (
                  <span>{record.dayText.replace("日", "")}</span>
                )}

                {record.sign && (
                  <span className="absolute -right-0.5 -bottom-0.5 flex size-3.5 items-center justify-center rounded-full bg-emerald-500 text-black ring-2 ring-[#16161a]">
                    <Check className="size-2.5 stroke-3" />
                  </span>
                )}
              </div>
            );

            if (record.sign) {
              return (
                <button
                  key={`${record.dayText}-${record.signTime}`}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectSignDay(record.signTime);
                  }}
                  className="relative z-10 cursor-pointer transition-transform hover:scale-110 focus:outline-hidden active:scale-95"
                  title={`${record.dayText} 签到详情`}
                >
                  {nodeElement}
                </button>
              );
            }

            if (record.today) {
              return (
                <button
                  key={record.dayText}
                  type="button"
                  onClick={onAction}
                  disabled={isLoading || isSigning}
                  className="relative z-10 cursor-pointer transition-transform hover:scale-110 focus:outline-hidden active:scale-95 disabled:cursor-wait disabled:opacity-60"
                  title={actionLabel}
                >
                  {nodeElement}
                </button>
              );
            }

            return (
              <div key={record.dayText} className="relative z-10" aria-label={record.dayText}>
                {nodeElement}
              </div>
            );
          })}
        </div>
      </div>

      {/* 底部居中打卡/签到按钮 */}
      <div className="flex justify-center pt-0.5">
        <button
          type="button"
          onClick={onAction}
          disabled={isLoading || isSigning}
          className={cn(
            "flex h-7.5 w-full max-w-[150px] items-center justify-center gap-1 rounded-full text-xs font-bold transition-all active:scale-95 disabled:cursor-wait disabled:opacity-60",
            hasSignedToday
              ? "border border-white/15 bg-white/10 text-zinc-200 hover:border-white/30 hover:bg-white/15"
              : "hover:scale-1.03 bg-emerald-500 text-black shadow-md shadow-emerald-500/25 hover:bg-emerald-400",
          )}
        >
          {isLoading || isSigning ? "..." : actionLabel}
        </button>
      </div>
    </section>
  );
}
