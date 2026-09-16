import { CalendarDays, Circle } from "lucide-react";
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
  const recentRecords = useMemo(() => signHistory?.signInfoList.slice(-3) ?? [], [signHistory]);

  return (
    <section className="px-6 py-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <CalendarDays className="mt-0.5 size-5 shrink-0 text-content-muted" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-content">{t("profile.menu.vipSign")}</p>
            {signHistory?.subText && (
              <p className="mt-1 text-xs leading-relaxed text-content-muted">
                {signHistory.subText}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onAction}
          disabled={isLoading || isSigning}
          className={cn(
            "h-9 shrink-0 rounded-xl px-4 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-hidden disabled:cursor-wait disabled:opacity-60",
            hasSignedToday
              ? "bg-surface-sunken text-content-muted hover:bg-accent hover:text-content"
              : "bg-brand text-brand-foreground hover:bg-brand-hover",
          )}
        >
          {isLoading || isSigning ? "..." : actionLabel}
        </button>
      </div>

      {recentRecords.length > 0 && (
        <div className="mt-5 flex items-start">
          {recentRecords.map((record, index) => {
            const status = (
              <>
                {record.sign ? (
                  <Circle className="size-3.5 fill-brand text-brand" aria-hidden="true" />
                ) : (
                  <Circle className="size-3.5 text-content-subtle" aria-hidden="true" />
                )}
                <span
                  className={cn(
                    "text-xs",
                    record.sign ? "text-content" : "text-content-muted",
                    record.today && "font-semibold",
                  )}
                >
                  {record.today ? t("profile.menu.signToday") : record.dayText}
                </span>
              </>
            );

            const connector =
              index < recentRecords.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "pointer-events-none absolute top-[7px] left-[calc(50%_+_7px)] h-px w-[calc(100%_-_14px)]",
                    record.sign && recentRecords[index + 1].sign ? "bg-brand" : "bg-content/20",
                  )}
                />
              ) : null;
            const dayClassName =
              "relative z-10 flex w-full min-w-0 flex-col items-center gap-2 rounded-sm px-1 focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-hidden";

            if (record.sign) {
              return (
                <div
                  key={`${record.dayText}-${record.signTime}`}
                  className="relative min-w-0 flex-1"
                >
                  {connector}
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectSignDay?.(record.signTime);
                    }}
                    className={cn(dayClassName, "cursor-pointer hover:text-brand")}
                    title={`${record.dayText} · ${actionLabel}`}
                  >
                    {status}
                  </button>
                </div>
              );
            }

            if (record.today) {
              return (
                <div key={record.dayText} className="relative min-w-0 flex-1">
                  {connector}
                  <button
                    type="button"
                    onClick={onAction}
                    disabled={isLoading || isSigning}
                    className={cn(
                      dayClassName,
                      "cursor-pointer hover:text-brand disabled:cursor-wait disabled:opacity-60",
                    )}
                    title={actionLabel}
                  >
                    {status}
                  </button>
                </div>
              );
            }

            return (
              <div key={record.dayText} className="relative min-w-0 flex-1">
                {connector}
                <div className={dayClassName}>{status}</div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
