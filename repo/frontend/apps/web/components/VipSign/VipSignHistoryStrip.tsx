import { Check } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { VipSignHistoryStripProps } from "@/types/components/vipSign";

export function VipSignHistoryStrip({ records, onSelectSignDay }: VipSignHistoryStripProps) {
  if (records.length === 0) return null;

  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
      {records.map((record) => {
        const cardClassName = cn(
          "relative flex min-w-0 flex-col items-center gap-1.5 p-1 text-[11px] transition-colors",
          record.sign ? "cursor-pointer text-content hover:text-brand" : "text-content-muted",
          record.today && "text-danger",
        );

        const content = (
          <>
            <span className="relative z-10 text-[10px]">
              {record.today ? "今天" : record.dayText}
            </span>
            <span
              className={cn(
                "relative z-10 flex size-9 items-center justify-center overflow-hidden rounded-full border",
                record.sign
                  ? "border-border bg-surface-elevated text-content"
                  : "border-dashed border-current text-content-muted",
                record.today && "border-danger text-danger",
              )}
            >
              {record.sign && record.songCoverUrl ? (
                <Image
                  fill
                  sizes="36px"
                  src={record.songCoverUrl}
                  alt=""
                  className="object-cover"
                />
              ) : record.today ? (
                <span>今</span>
              ) : (
                <span>{record.dayText.replace("日", "")}</span>
              )}
              {record.sign ? (
                <span className="absolute -right-0.5 -bottom-0.5 flex size-3.5 items-center justify-center rounded-full bg-brand text-brand-foreground ring-2 ring-surface-raised">
                  <Check className="size-2.5 stroke-3" />
                </span>
              ) : null}
            </span>
          </>
        );

        return record.sign ? (
          <button
            key={`${record.dayText}-${record.signTime}`}
            type="button"
            className={cardClassName}
            onClick={() => onSelectSignDay(record.signTime)}
            aria-label={record.dayText}
          >
            {content}
          </button>
        ) : (
          <div key={record.dayText} className={cardClassName} aria-label={record.dayText}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
