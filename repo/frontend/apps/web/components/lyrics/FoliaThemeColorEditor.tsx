"use client";

import { HexColorPicker } from "react-colorful";
import { useState } from "react";
import { onAccentColor } from "@scopify/ui/scopify/components/folia-panel/tokens";
import { useI18n } from "@/store/module/i18n";

import type { FoliaThemeColorEditorProps } from "@/types/lyrics/components";
import type { FoliaThemeColors } from "@/types/lyrics/folia/stage";

const COLOR_FIELDS = [
  ["backgroundColor", "folia.options.aiThemeQuickEditBackground"],
  ["primaryColor", "folia.options.aiThemeQuickEditPrimary"],
  ["accentColor", "folia.options.aiThemeQuickEditAccent"],
  ["secondaryColor", "folia.options.aiThemeQuickEditSecondary"],
] as const satisfies readonly [keyof FoliaThemeColors, string][];

export function FoliaThemeColorEditor({
  onDraftChange,
  theme,
  variant,
}: FoliaThemeColorEditorProps) {
  const { t } = useI18n();
  const [activeKey, setActiveKey] = useState<keyof FoliaThemeColors>("accentColor");
  const colors = theme[variant];
  const activeLabel = COLOR_FIELDS.find(([key]) => key === activeKey)?.[1];

  const updateColor = (key: keyof FoliaThemeColors, value: string) => {
    onDraftChange({
      ...theme,
      [variant]: {
        ...theme[variant],
        [key]: value,
      },
    });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {COLOR_FIELDS.map(([key, label]) => {
          const isActive = activeKey === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveKey(key)}
              className="flex items-center gap-2 rounded-xl border p-3 text-left transition"
              style={{
                backgroundColor: isActive ? "var(--st-fill)" : "var(--st-card)",
                borderColor: isActive ? "var(--st-line2)" : "var(--st-line)",
              }}
            >
              <span
                className="size-7 shrink-0 rounded-lg border border-black/10"
                style={{ backgroundColor: colors[key] }}
              />
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium">{t(label)}</span>
                <span className="block truncate font-mono text-xs text-[color:var(--st-t2)]">
                  {colors[key].toUpperCase()}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3 rounded-xl border border-[var(--st-line)] bg-[var(--st-card)] p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium">{activeLabel ? t(activeLabel) : null}</span>
          <span
            className="rounded-full px-2.5 py-1 font-mono text-[11px]"
            style={{ backgroundColor: colors[activeKey], color: onAccentColor(colors[activeKey]) }}
          >
            {colors[activeKey].toUpperCase()}
          </span>
        </div>
        <HexColorPicker
          color={colors[activeKey]}
          onChange={(color) => updateColor(activeKey, color)}
          style={{ height: 210, width: "100%" }}
        />
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-[color:var(--st-t2)]">HEX</span>
          <input
            type="text"
            value={colors[activeKey]}
            onChange={(event) => updateColor(activeKey, event.target.value)}
            className="w-full rounded-lg border border-[var(--st-line2)] bg-transparent px-3 py-2 font-mono text-sm transition outline-none focus:border-[var(--st-accent)]"
            spellCheck={false}
          />
        </label>
      </div>
    </div>
  );
}
