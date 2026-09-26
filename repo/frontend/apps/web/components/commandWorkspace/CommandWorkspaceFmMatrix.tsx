"use client";

import { useEffect, useRef } from "react";
import { isPersonalFmCommandSelected } from "@/lib/commandWorkspace/personalFmCommands";
import { cn } from "@/lib/utils";
import type { CommandWorkspaceFmMatrixProps } from "@/types/commandWorkspacePersonalFm";

export function CommandWorkspaceFmMatrix({
  groups,
  selection,
  highlightedId,
  disabled,
  onSelect,
}: CommandWorkspaceFmMatrixProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector('[data-highlighted="true"]')?.scrollIntoView({ block: "nearest" });
  }, [highlightedId]);
  return (
    <div ref={ref} className="space-y-3">
      {groups.map((group) => (
        <section
          key={group.id}
          aria-label={group.label}
          className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-2 sm:grid-cols-[3rem_minmax(0,1fr)] sm:gap-3"
        >
          <h3 className="pt-1.5 text-[11px] text-zinc-500">{group.label}</h3>
          <div className="grid grid-cols-3 gap-1 min-[440px]:grid-cols-5 sm:grid-cols-7">
            {group.entries.map((entry) => {
              const active = isPersonalFmCommandSelected(entry.action, selection);
              return (
                <button
                  key={entry.id}
                  type="button"
                  aria-pressed={active}
                  disabled={disabled}
                  data-highlighted={entry.id === highlightedId}
                  onClick={() => onSelect(entry)}
                  className={cn(
                    "min-w-0 rounded-full p-1 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-wait disabled:opacity-45",
                    active
                      ? "bg-brand font-medium text-brand-foreground"
                      : "text-zinc-300 hover:bg-white/8 hover:text-white",
                    entry.id === highlightedId && "ring-1 ring-brand/70",
                  )}
                >
                  {entry.label}
                </button>
              );
            })}
          </div>
        </section>
      ))}
      {!groups.length ? (
        <p className="py-12 text-center text-sm text-zinc-500">没有匹配的模式或场景。</p>
      ) : null}
    </div>
  );
}
