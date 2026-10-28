"use client";

import { Moon, Sun, Trash2 } from "lucide-react";

import { useLyricStageStore } from "@/store/module/lyrics";
import { useI18n } from "@/store/module/i18n";
import type { FoliaThemeIdentityControlsProps } from "@/types/lyrics/components";

export function FoliaThemeIdentityControls({
  draftTheme,
  onDeleteTheme,
  onDraftChange,
}: FoliaThemeIdentityControlsProps) {
  const { t } = useI18n();
  const themeVariant = useLyricStageStore((state) => state.themeVariant);
  const setThemeVariant = useLyricStageStore((state) => state.setThemeVariant);

  return (
    <div className="rounded-xl border border-[var(--st-line)] bg-[var(--st-card)] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <label className="min-w-0 flex-1 space-y-1">
          <span className="text-xs font-medium text-[color:var(--st-t2)]">
            {t("folia.options.themeName")}
          </span>
          <input
            className="w-full border-b border-[var(--st-line2)] bg-transparent py-1 text-sm font-medium text-[color:var(--st-t1)] transition outline-none focus:border-[var(--st-accent)]"
            onChange={(event) => onDraftChange({ ...draftTheme, name: event.target.value })}
            value={draftTheme.name}
          />
        </label>
        <button
          aria-label={String(t("folia.options.deleteTheme"))}
          className="flex size-9 shrink-0 items-center justify-center rounded-xl text-rose-400 transition hover:bg-rose-500/10"
          onClick={onDeleteTheme}
          title={String(t("folia.options.deleteTheme"))}
          type="button"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="flex rounded-lg bg-[var(--st-fill)] p-1">
        {(
          [
            ["light", Sun, "folia.options.lightTheme"],
            ["dark", Moon, "folia.options.darkTheme"],
          ] as const
        ).map(([variant, Icon, label]) => {
          const active = themeVariant === variant;
          return (
            <button
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border py-2 text-xs transition-all"
              key={variant}
              onClick={() => setThemeVariant(variant)}
              aria-pressed={active}
              style={{
                backgroundColor: active ? "var(--st-card)" : "transparent",
                borderColor: "transparent",
                color: active ? "var(--st-t1)" : "var(--st-t2)",
                boxShadow: active ? "0 1px 3px #0001" : "none",
              }}
              type="button"
            >
              <Icon size={14} />
              {t(label)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
