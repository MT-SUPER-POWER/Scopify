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
    <section className="bg-surface-elevated border-border hover:border-content/20 relative my-2 overflow-hidden rounded-xl border p-3 shadow-xs transition-all">
      {/* 顶部标题与奖励提示 */}
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <CalendarDays className="text-brand size-4 shrink-0" />
          <span className="text-content truncate text-xs font-bold">
            {t("profile.menu.vipSign")}
          </span>
        </div>
        {signHistory?.subText && (
          <span className="text-content-muted flex shrink-0 items-center gap-1 truncate text-[11px]">
            <Flame className="text-warning size-3" />
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
                record.today ? "text-brand font-bold" : "text-content-muted",
              )}
            >
              {record.today ? "今天" : record.dayText}
            </span>
          ))}
        </div>

        {/* 圆圈 Node 行（背景居中横线被实心节点遮挡） */}
        <div className="relative flex w-full items-center justify-evenly">
          {/* 背景居中虚线 - top-1/2 垂直精准对齐圆圈中心 */}
          <div className="border-border pointer-events-none absolute inset-x-6 top-1/2 z-0 h-px -translate-y-1/2 border-t border-dashed" />

          {recentRecords.map((record) => {
            const nodeElement = (
              <div
                className={cn(
                  "bg-surface-sunken relative z-10 flex size-8 items-center justify-center rounded-full text-[10px] font-semibold shadow-xs transition-all",
                  record.sign
                    ? "border-brand/50 text-brand ring-brand/20 border ring-2"
                    : record.today
                      ? "text-brand border-brand ring-brand/20 animate-pulse border-2 ring-2"
                      : "border-border text-content-muted border",
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
                  <span className="bg-brand text-brand-foreground ring-surface-elevated absolute -right-0.5 -bottom-0.5 flex size-3.5 items-center justify-center rounded-full ring-2">
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
                    onSelectSignDay?.(record.signTime);
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
              ? "bg-surface-sunken border-border text-content hover:border-content/30 hover:bg-accent border"
              : "bg-brand text-brand-foreground shadow-brand hover:bg-brand-hover hover:scale-1.03",
          )}
        >
          {isLoading || isSigning ? "..." : actionLabel}
        </button>
      </div>
    </section>
  );
}
