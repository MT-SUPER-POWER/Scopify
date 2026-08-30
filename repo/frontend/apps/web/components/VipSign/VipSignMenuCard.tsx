import { CalendarDays, CheckCircle2, Circle, Flame } from "lucide-react";
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
    <section className="my-1.5 rounded-xl bg-surface-elevated/60 p-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <CalendarDays className="size-3.5 shrink-0 text-content-muted" />
          <span className="truncate text-xs font-semibold text-content">
            {t("profile.menu.vipSign")}
          </span>
          {signHistory?.subText && (
            <span className="flex min-w-0 items-center gap-1 truncate text-[11px] text-content-muted">
              <Flame className="size-3 shrink-0 text-warning" />
              {signHistory.subText}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onAction}
          disabled={isLoading || isSigning}
          className={cn(
            "h-7 shrink-0 rounded-md px-2.5 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-hidden disabled:cursor-wait disabled:opacity-60",
            hasSignedToday
              ? "bg-surface-sunken text-content-muted hover:bg-accent hover:text-content"
              : "bg-brand text-brand-foreground hover:bg-brand-hover",
          )}
        >
          {isLoading || isSigning ? "..." : actionLabel}
        </button>
      </div>

      {recentRecords.length > 0 && (
        <div className="mt-2.5 flex items-center justify-around rounded-lg bg-content/5 px-2.5 py-1.5">
          {recentRecords.map((record) => {
            const status = (
              <>
                {record.sign ? (
                  <CheckCircle2 className="size-3.5 text-brand" aria-hidden="true" />
                ) : (
                  <Circle className="size-3.5 text-content-subtle" aria-hidden="true" />
                )}
                <span
                  className={cn(
                    "text-[11px]",
                    record.sign ? "text-content" : "text-content-muted",
                    record.today && "font-semibold",
                  )}
                >
                  {record.today ? "今日" : record.dayText}
                </span>
              </>
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
                  className="flex min-w-0 cursor-pointer items-center gap-1 rounded-sm px-1 py-0.5 transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-hidden"
                  title={`${record.dayText} 签到详情`}
                >
                  {status}
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
                  className="flex min-w-0 cursor-pointer items-center gap-1 rounded-sm px-1 py-0.5 transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-hidden disabled:cursor-wait disabled:opacity-60"
                  title={actionLabel}
                >
                  {status}
                </button>
              );
            }

            return (
              <div key={record.dayText} className="flex min-w-0 items-center gap-1 px-1 py-0.5">
                {status}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
