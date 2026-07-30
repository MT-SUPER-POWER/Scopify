"use client";

import { Check, Moon, RotateCcw, Sun, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/store/module/i18n";

import { FoliaSettingsPreview } from "@/components/lyrics/FoliaSettingsPreview";
import { FoliaThemeColorEditor } from "@/components/lyrics/FoliaThemeColorEditor";
import { FoliaThemeJsonTransfer } from "@/components/lyrics/FoliaThemeJsonTransfer";
import { colorWithAlpha } from "@/components/lyrics/folia/src/components/visualizer/colorMix";
import { getFoliaThemeColors, isBuiltinFoliaStageTheme } from "@/lib/lyrics/foliaTheme";
import { useLyricStageStore } from "@/store/module/lyrics";
import type { Theme } from "@/components/lyrics/folia/src/types";
import type { FoliaThemeEditorProps } from "@/types/components/lyrics";

type EditorTab = "edit" | "import-export";

export function FoliaThemeEditor({ assets, onSelectTheme, selectedTheme }: FoliaThemeEditorProps) {
  const { t } = useI18n();
  const fontFamily = useLyricStageStore((state) => state.fontFamily);
  const fontStyle = useLyricStageStore((state) => state.fontStyle);
  const themeVariant = useLyricStageStore((state) => state.themeVariant);
  const setThemeVariant = useLyricStageStore((state) => state.setThemeVariant);
  const updateTheme = useLyricStageStore((state) => state.updateTheme);
  const resetTheme = useLyricStageStore((state) => state.resetTheme);
  const deleteTheme = useLyricStageStore((state) => state.deleteTheme);
  const [draftTheme, setDraftTheme] = useState(selectedTheme);
  const [editorTab, setEditorTab] = useState<EditorTab>("edit");
  const activeColors = getFoliaThemeColors(draftTheme, themeVariant);
  const isBuiltin = isBuiltinFoliaStageTheme(selectedTheme.id);

  useEffect(() => setDraftTheme(selectedTheme), [selectedTheme]);

  const previewTheme = useMemo<Theme>(
    () => ({
      ...activeColors,
      animationIntensity: "normal",
      fontFamily: fontFamily ?? undefined,
      fontFamilyStack: [],
      fontStyle,
      name: themeVariant === "light" ? "snow" : draftTheme.id,
    }),
    [activeColors, draftTheme.id, fontFamily, fontStyle, themeVariant],
  );

  const deleteSelectedTheme = () => {
    deleteTheme(selectedTheme.id);
    onSelectTheme(useLyricStageStore.getState().themeId);
  };

  const TAB_ITEMS: { key: EditorTab; label: string }[] = [
    { key: "edit", label: t("folia.options.themeEdit") },
    { key: "import-export", label: t("folia.options.themeImportExport") },
  ];

  return (
    <div className="grid min-h-0 gap-4 lg:grid-cols-[minmax(0,1.12fr)_330px]">
      <FoliaSettingsPreview
        activeSection="common"
        assets={assets}
        onSectionChange={() => undefined}
        theme={previewTheme}
      />

      <div className="visualizer-overlay-scrollbar min-h-0 space-y-3 overflow-y-auto pr-1">
        {/* Tabs 切换 - 顶部 */}
        <div
          className="flex rounded-xl p-1"
          style={{ backgroundColor: colorWithAlpha(activeColors.backgroundColor, 0.5) }}
        >
          {TAB_ITEMS.map((tab) => {
            const active = editorTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setEditorTab(tab.key)}
                className="flex flex-1 items-center justify-center rounded-lg border py-2 text-xs font-medium transition-all"
                style={{
                  borderColor: active
                    ? colorWithAlpha(activeColors.accentColor, 0.5)
                    : "transparent",
                  backgroundColor: active
                    ? colorWithAlpha(activeColors.accentColor, 0.15)
                    : "transparent",
                  color: active ? activeColors.primaryColor : `${activeColors.secondaryColor}99`,
                  boxShadow: active
                    ? `inset 0 0 0 1px ${colorWithAlpha(activeColors.accentColor, 0.2)}`
                    : "none",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── 编辑 Tab ──────────────────────────── */}
        {editorTab === "edit" && (
          <>
            <div className="rounded-[24px] border border-white/10 bg-white/4.5 p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <label className="min-w-0 flex-1 space-y-1">
                  <span className="text-[10px] font-semibold tracking-[0.2em] uppercase opacity-50">
                    {t("folia.options.themeName")}
                  </span>
                  <input
                    value={draftTheme.name}
                    onChange={(event) => setDraftTheme({ ...draftTheme, name: event.target.value })}
                    className="w-full border-b border-white/15 bg-transparent pb-1 text-base font-semibold transition outline-none focus:border-white/50"
                  />
                </label>
                <button
                  type="button"
                  title={String(t("folia.options.deleteTheme"))}
                  onClick={deleteSelectedTheme}
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl text-rose-400 transition hover:bg-rose-500/10"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div
                className="flex rounded-xl p-1"
                style={{ backgroundColor: colorWithAlpha(activeColors.backgroundColor, 0.5) }}
              >
                {(
                  [
                    ["light", Sun, "folia.options.lightTheme"],
                    ["dark", Moon, "folia.options.darkTheme"],
                  ] as const
                ).map(([variant, Icon, label]) => {
                  const active = themeVariant === variant;
                  return (
                    <button
                      key={variant}
                      type="button"
                      onClick={() => setThemeVariant(variant)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border py-2 text-xs transition-all"
                      style={{
                        borderColor: active
                          ? colorWithAlpha(activeColors.accentColor, 0.5)
                          : "transparent",
                        backgroundColor: active
                          ? colorWithAlpha(activeColors.accentColor, 0.15)
                          : "transparent",
                        color: active
                          ? activeColors.primaryColor
                          : `${activeColors.secondaryColor}99`,
                        boxShadow: active
                          ? `inset 0 0 0 1px ${colorWithAlpha(activeColors.accentColor, 0.2)}`
                          : "none",
                      }}
                    >
                      <Icon size={14} />
                      {t(label)}
                    </button>
                  );
                })}
              </div>
            </div>

            <FoliaThemeColorEditor
              onDraftChange={setDraftTheme}
              theme={draftTheme}
              variant={themeVariant}
            />

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  isBuiltin ? resetTheme(selectedTheme.id) : setDraftTheme(selectedTheme)
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-current/20 px-3 py-2.5 text-xs transition hover:brightness-95"
                style={{
                  backgroundColor: colorWithAlpha(activeColors.secondaryColor, 0.1),
                  color: activeColors.secondaryColor,
                }}
              >
                <RotateCcw size={14} />
                {t("folia.options.resetTheme")}
              </button>
              <button
                type="button"
                onClick={() => updateTheme(draftTheme)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-current/20 px-3 py-2.5 text-xs font-semibold shadow-sm transition hover:brightness-110"
                style={{
                  backgroundColor: activeColors.accentColor,
                  color: activeColors.backgroundColor,
                  borderColor: colorWithAlpha(activeColors.accentColor, 0.3),
                }}
              >
                <Check size={14} />
                {t("folia.ui.save")}
              </button>
            </div>
          </>
        )}

        {/* ── 导入导出 Tab ──────────────────────── */}
        {editorTab === "import-export" && (
          <FoliaThemeJsonTransfer onSelectTheme={onSelectTheme} theme={draftTheme} />
        )}
      </div>
    </div>
  );
}
