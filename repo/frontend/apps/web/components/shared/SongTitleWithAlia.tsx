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
    <span
      className={cn("flex min-w-0 items-center gap-1", className)}
      title={aliaText ? `${name} (${aliaText})` : name}
    >
      <span className="max-w-full min-w-0 shrink-0 truncate">{name}</span>
      {aliaText ? (
        <span
          className={cn("min-w-0 truncate font-normal text-content-subtle", aliaClassName)}
        >{` (${aliaText})`}</span>
      ) : null}
    </span>
  );
}
