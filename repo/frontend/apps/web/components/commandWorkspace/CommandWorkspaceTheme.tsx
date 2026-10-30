"use client";

import { Fragment } from "react";
import { Check, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCommandWorkspaceTheme } from "@/hooks/commandWorkspace/useCommandWorkspaceTheme";
import { cn } from "@/lib/utils";
import type { CommandWorkspaceThemeProps } from "@/types/commandWorkspace/model";

export function CommandWorkspaceTheme(props: CommandWorkspaceThemeProps) {
  const {
    filteredItems,
    handleKeyDown,
    inputRef,
    listRef,
    query,
    selectedIndex,
    setQuery,
    setSelectedIndex,
  } = useCommandWorkspaceTheme(props);

  return (
    <>
      <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
        <Search className="size-4 shrink-0 text-content-muted" />
        <input
          ref={inputRef}
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="搜索外观模式或主题配色…"
          className="min-w-0 flex-1 border-none bg-transparent text-sm font-medium text-content outline-none placeholder:text-content/40"
        />
      </div>

      <ScrollArea className="h-[min(52vh,32rem)]">
        <div ref={listRef} className="space-y-0.5 px-2.5 py-2">
          {filteredItems.map((item, index) => {
            const isFirstInCategory =
              index === 0 || item.category !== filteredItems[index - 1]?.category;
            const Icon = item.icon;

            return (
              <Fragment key={item.id}>
                {isFirstInCategory && (
                  <div className="px-3 pt-3 pb-1 text-xs font-semibold text-content-muted">
                    {item.category === "mode" ? "外观模式" : "主题配色"}
                  </div>
                )}
                <button
                  type="button"
                  data-selected={selectedIndex === index}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={item.action}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-left transition-colors",
                    selectedIndex === index ? "bg-content/10" : "hover:bg-content/6",
                  )}
                >
                  {Icon ? (
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-content/8 text-content-muted">
                      <Icon className="size-4" />
                    </span>
                  ) : item.colors ? (
                    <span
                      aria-hidden
                      className="size-7 shrink-0 rounded-md border border-border/80 shadow-xs"
                      style={{
                        background: `linear-gradient(135deg, ${item.colors.top}, ${item.colors.bottom})`,
                      }}
                    />
                  ) : null}

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-content">
                      {item.label}
                    </span>
                    <span className="block truncate text-xs text-content-muted">
                      {item.summary}
                    </span>
                  </span>

                  {item.active ? (
                    <Check aria-label="当前选择" className="size-4 shrink-0 text-content" />
                  ) : null}
                </button>
              </Fragment>
            );
          })}

          {filteredItems.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-content-muted">
              没有匹配的外观或主题。
            </p>
          ) : null}
        </div>
      </ScrollArea>
    </>
  );
}
