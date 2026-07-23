"use client";

import { Check, Moon, RotateCcw, Sun, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { FoliaSettingsPreview } from "@/components/lyrics/FoliaSettingsPreview";
import { FoliaThemeColorEditor } from "@/components/lyrics/FoliaThemeColorEditor";
import { FoliaThemeJsonTransfer } from "@/components/lyrics/FoliaThemeJsonTransfer";
import { getFoliaThemeColors, isBuiltinFoliaStageTheme } from "@/lib/lyrics/foliaTheme";
import { useLyricStageStore } from "@/store/module/lyrics";
import type { Theme } from "@/components/lyrics/folia/src/types";
import type { FoliaThemeEditorProps } from "@/types/components/lyrics";

type EditorTab = "edit" | "import-export";

export function FoliaThemeEditor({ assets, onSelectTheme, selectedTheme }: FoliaThemeEditorProps) {
  const { t } = useTranslation();
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
    { key: "edit", label: t("options.themeEdit") },
    { key: "import-export", label: t("options.themeImportExport") },
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
        <div className="flex rounded-xl bg-black/15 p-1">
          {TAB_ITEMS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setEditorTab(tab.key)}
              className={`flex flex-1 items-center justify-center rounded-lg py-2 text-xs font-medium transition ${
                editorTab === tab.key ? "bg-white/15 shadow-sm" : "opacity-50 hover:opacity-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── 编辑 Tab ──────────────────────────── */}
        {editorTab === "edit" && (
          <>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.045] p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <label className="min-w-0 flex-1 space-y-1">
                  <span className="text-[10px] font-semibold tracking-[0.2em] uppercase opacity-50">
                    {t("options.themeName")}
                  </span>
                  <input
                    value={draftTheme.name}
                    onChange={(event) => setDraftTheme({ ...draftTheme, name: event.target.value })}
                    className="w-full border-b border-white/15 bg-transparent pb-1 text-base font-semibold transition outline-none focus:border-white/50"
                  />
                </label>
                <button
                  type="button"
                  title={String(t("options.deleteTheme"))}
                  onClick={deleteSelectedTheme}
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl text-rose-400 transition hover:bg-rose-500/10"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex rounded-xl bg-black/15 p-1">
                {(
                  [
                    ["light", Sun, "options.lightTheme"],
                    ["dark", Moon, "options.darkTheme"],
                  ] as const
                ).map(([variant, Icon, label]) => (
                  <button
                    key={variant}
                    type="button"
                    onClick={() => setThemeVariant(variant)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs transition ${
                      themeVariant === variant
                        ? "bg-white/15 shadow-sm"
                        : "opacity-50 hover:opacity-100"
                    }`}
                  >
                    <Icon size={14} />
                    {t(label)}
                  </button>
                ))}
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
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs transition hover:bg-white/10"
              >
                <RotateCcw size={14} />
                {t("options.resetTheme")}
              </button>
              <button
                type="button"
                onClick={() => updateTheme(draftTheme)}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold shadow-sm"
                style={{
                  backgroundColor: activeColors.accentColor,
                  color: activeColors.backgroundColor,
                }}
              >
                <Check size={14} />
                {t("ui.save")}
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
