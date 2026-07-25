import { cn } from "@/lib/utils";
import { SongVipBadge } from "@/components/shared/SongVipBadge";

interface SongTitleWithAliaProps {
  name: string;
  alia?: string[];
  fee?: number;
  className?: string;
  aliaClassName?: string;
}

export function SongTitleWithAlia({
  name,
  alia,
  fee,
  className,
  aliaClassName,
}: SongTitleWithAliaProps) {
  const aliaText = alia?.filter(Boolean).join(" ") ?? "";

  return (
    <span
      className={cn("flex min-w-0 items-center gap-1", className)}
      title={aliaText ? `${name} (${aliaText})` : name}
    >
      <span className="truncate">{name}</span>
      <SongVipBadge fee={fee} />
      {aliaText ? (
        <span
          className={cn("shrink-0 font-normal text-zinc-500", aliaClassName)}
        >{` (${aliaText})`}</span>
      ) : null}
    </span>
  );
}
