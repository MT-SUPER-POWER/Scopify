import { cn } from "@scopify/ui/shadcn/lib/utils";
import type { MediaTitleProps } from "@scopify/ui/scopify/types/components";

export type { MediaTitleProps } from "@scopify/ui/scopify/types/components";

export function MediaTitle({ name, aliases, className, aliasesClassName }: MediaTitleProps) {
  const aliasesText = aliases?.filter(Boolean).join(" ") ?? "";

  return (
    <span
      className={cn("flex min-w-0 items-center gap-1", className)}
      title={aliasesText ? `${name} (${aliasesText})` : name}
    >
      <span className="max-w-full min-w-0 shrink-0 truncate">{name}</span>
      {aliasesText ? (
        <span
          className={cn("text-content-subtle min-w-0 truncate font-normal", aliasesClassName)}
        >{` (${aliasesText})`}</span>
      ) : null}
    </span>
  );
}
