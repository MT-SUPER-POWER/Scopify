"use client";

import { Moon, Search, Sun } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@scopify/ui/shadcn/components/button";
import { Input } from "@scopify/ui/shadcn/components/input";

import { ThemeTokenField } from "@/components/theme-lab/theme-token-field";
import type { ThemeControlPanelProps, ThemeTokenDefinition } from "@/types/theme-lab";

function groupTokens(definitions: readonly ThemeTokenDefinition[]) {
  return definitions.reduce<Record<string, ThemeTokenDefinition[]>>((groups, definition) => {
    (groups[definition.group] ??= []).push(definition);
    return groups;
  }, {});
}

export function ThemeControlPanel({
  definitions,
  layer,
  mode,
  onLayerChange,
  onModeChange,
  onTokenChange,
  scope,
  values,
}: ThemeControlPanelProps) {
  const [query, setQuery] = useState("");
  const grouped = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return groupTokens(
      definitions.filter(
        (definition) =>
          definition.layer === layer &&
          (!normalizedQuery ||
            definition.label.toLowerCase().includes(normalizedQuery) ||
            definition.name.includes(normalizedQuery)),
      ),
    );
  }, [definitions, layer, query]);

  return (
    <section className="bg-background flex min-h-[38rem] flex-col overflow-hidden rounded-xl border">
      <div className="space-y-3 border-b p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="bg-muted flex rounded-lg p-1">
            <Button
              size="sm"
              variant={mode === "light" ? "secondary" : "ghost"}
              onClick={() => onModeChange("light")}
            >
              <Sun /> 浅色
            </Button>
            <Button
              size="sm"
              variant={mode === "dark" ? "secondary" : "ghost"}
              onClick={() => onModeChange("dark")}
            >
              <Moon /> 深色
            </Button>
          </div>
          {scope === "scopify" ? (
            <div className="bg-muted flex rounded-lg p-1">
              <Button
                size="sm"
                variant={layer === "shadcn" ? "secondary" : "ghost"}
                onClick={() => onLayerChange("shadcn")}
              >
                Shadcn 基础
              </Button>
              <Button
                size="sm"
                variant={layer === "scopify" ? "secondary" : "ghost"}
                onClick={() => onLayerChange("scopify")}
              >
                Scopify 扩展
              </Button>
            </div>
          ) : null}
        </div>
        <label className="relative block">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            className="pl-9"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索 Token"
            value={query}
          />
        </label>
      </div>
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
        {Object.entries(grouped).map(([group, tokens]) => (
          <div className="space-y-2" key={group}>
            <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {group}
            </h3>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {tokens.map((definition) => (
                <ThemeTokenField
                  definition={definition}
                  key={definition.name}
                  onChange={(value) => onTokenChange(definition, value)}
                  value={values[definition.name] ?? ""}
                />
              ))}
            </div>
          </div>
        ))}
        {Object.keys(grouped).length === 0 ? (
          <p className="text-muted-foreground py-12 text-center text-sm">没有匹配的 Token。</p>
        ) : null}
      </div>
    </section>
  );
}
