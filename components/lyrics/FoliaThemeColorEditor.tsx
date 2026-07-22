"use client";

import { HexColorPicker } from "react-colorful";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { FoliaThemeColorEditorProps } from "@/types/components/lyrics";
import type { FoliaThemeColors } from "@/types/foliaStage";

const COLOR_FIELDS = [
  ["backgroundColor", "options.aiThemeQuickEditBackground"],
  ["primaryColor", "options.aiThemeQuickEditPrimary"],
  ["accentColor", "options.aiThemeQuickEditAccent"],
  ["secondaryColor", "options.aiThemeQuickEditSecondary"],
] as const satisfies readonly [keyof FoliaThemeColors, string][];

export function FoliaThemeColorEditor({
  onDraftChange,
  theme,
  variant,
}: FoliaThemeColorEditorProps) {
  const { t } = useTranslation();
  const [activeKey, setActiveKey] = useState<keyof FoliaThemeColors>("accentColor");
  const colors = theme[variant];

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
              className="flex items-center gap-2 rounded-2xl border p-2.5 text-left transition"
              style={{
                backgroundColor: isActive ? `${colors.accentColor}12` : "rgba(255,255,255,0.035)",
                borderColor: isActive ? colors.accentColor : "rgba(255,255,255,0.1)",
              }}
            >
              <span
                className="size-7 shrink-0 rounded-lg border border-black/10"
                style={{ backgroundColor: colors[key] }}
              />
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium">{t(label)}</span>
                <span className="block truncate font-mono text-[10px] opacity-55">
                  {colors[key].toUpperCase()}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3 rounded-[22px] border border-white/10 bg-black/10 p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium">
            {t(COLOR_FIELDS.find(([key]) => key === activeKey)?.[1] ?? "")}
          </span>
          <span
            className="rounded-full px-2.5 py-1 font-mono text-[11px]"
            style={{ backgroundColor: colors[activeKey], color: colors.backgroundColor }}
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
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase opacity-50">
            HEX
          </span>
          <input
            type="text"
            value={colors[activeKey]}
            onChange={(event) => updateColor(activeKey, event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm transition outline-none focus:border-white/30"
            spellCheck={false}
          />
        </label>
      </div>
    </div>
  );
}
