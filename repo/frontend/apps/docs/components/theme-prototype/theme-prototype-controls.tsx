"use client";

import { ChevronRight, Search, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";

import { ThemePrototypeTokenRow } from "@/components/theme-prototype/theme-prototype-token-row";
import { ThemePrototypeSecondaryControls } from "@/components/theme-prototype/theme-prototype-secondary-controls";
import type {
  ThemePrototypeControlTab,
  ThemePrototypeControlsProps,
  ThemeTokenDefinition,
} from "@/types/theme-lab";

const CONTROL_TABS: ReadonlyArray<{ label: string; value: ThemePrototypeControlTab }> = [
  { label: "Colors", value: "colors" },
  { label: "Typography", value: "typography" },
  { label: "Other", value: "other" },
  { label: "Generate", value: "generate" },
];

export function ThemePrototypeControls({
  definitions,
  onTokenChange,
  values,
}: ThemePrototypeControlsProps) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<ThemePrototypeControlTab>("colors");
  const groups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const visible = definitions.filter((definition) => {
      const matchesTab =
        tab === "colors" ? definition.kind === "color" : definition.kind !== "color";
      const matchesQuery =
        !normalizedQuery ||
        definition.label.toLowerCase().includes(normalizedQuery) ||
        definition.group.toLowerCase().includes(normalizedQuery) ||
        definition.name.includes(normalizedQuery);
      return matchesTab && matchesQuery;
    });

    return visible.reduce<Record<string, ThemeTokenDefinition[]>>((result, definition) => {
      (result[definition.group] ??= []).push(definition);
      return result;
    }, {});
  }, [definitions, query, tab]);

  return (
    <aside className="bg-background flex h-full min-h-0 flex-col border-r">
      <nav className="flex h-12 shrink-0 items-center gap-0.5 overflow-x-auto px-4">
        {CONTROL_TABS.map((item) => (
          <button
            className="data-[active=true]:bg-secondary data-[active=true]:text-secondary-foreground text-muted-foreground hover:text-foreground flex h-7 shrink-0 items-center rounded-full px-3 text-sm transition-colors"
            data-active={tab === item.value}
            key={item.value}
            type="button"
            onClick={() => setTab(item.value)}
          >
            {item.value === "generate" ? <Sparkles className="mr-1 size-3.5" /> : null}
            {item.label}
          </button>
        ))}
      </nav>

      {tab === "colors" ? (
        <>
          <div className="px-4 pb-3">
            <label className="bg-muted/50 flex h-10 items-center gap-2.5 rounded-xl border px-3">
              <Search className="text-muted-foreground size-4 shrink-0" />
              <input
                className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-sm outline-none"
                placeholder="Search colors..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              {query ? (
                <button type="button" onClick={() => setQuery("")}>
                  <X className="text-muted-foreground size-4" />
                </button>
              ) : null}
            </label>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            {Object.entries(groups).map(([group, tokens], index) => (
              <details className="group/control" key={group} open={index < 2}>
                <summary className="flex cursor-pointer list-none items-center py-1">
                  <span className="bg-muted flex items-center gap-1 rounded-md border border-transparent px-2 py-0.5 group-open/control:[&>svg]:rotate-90">
                    <ChevronRight className="text-muted-foreground size-3 transition-transform" />
                    <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
                      {group}
                    </span>
                  </span>
                </summary>
                <div className="flex flex-col pt-1 pb-2">
                  {tokens.map((definition) => (
                    <ThemePrototypeTokenRow
                      definition={definition}
                      key={definition.name}
                      value={values[definition.name] ?? ""}
                      onChange={(value) => onTokenChange(definition, value)}
                    />
                  ))}
                </div>
              </details>
            ))}
          </div>
        </>
      ) : (
        <ThemePrototypeSecondaryControls
          definitions={definitions}
          tab={tab}
          values={values}
          onTokenChange={onTokenChange}
        />
      )}
    </aside>
  );
}
