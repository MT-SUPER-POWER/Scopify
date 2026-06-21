import { cn } from "@/lib/utils";

interface SongTitleWithAliaProps {
  name: string;
  alia?: string[];
  className?: string;
  aliaClassName?: string;
}

export function SongTitleWithAlia({
  name,
  alia,
  className,
  aliaClassName,
}: SongTitleWithAliaProps) {
  const aliaText = alia?.filter(Boolean).join(" ") ?? "";

  return (
    <span className={cn("truncate", className)} title={aliaText ? `${name} (${aliaText})` : name}>
      <span>{name}</span>
      {aliaText ? (
        <span className={cn("text-zinc-500 font-normal", aliaClassName)}>{` (${aliaText})`}</span>
      ) : null}
    </span>
  );
}
