"use client";

import { Clipboard, Download, FileInput } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { parseFoliaStageThemeJson } from "@/lib/lyrics/foliaTheme";
import { useLyricStageStore } from "@/store/module/lyrics";
import type { FoliaThemeColors } from "@/types/foliaStage";
import type { FoliaThemeJsonTransferProps } from "@/types/components/lyrics";

type ImportMode = "overwrite" | "new";

const COLOR_FIELDS = [
  ["backgroundColor", "options.aiThemeQuickEditBackground"],
  ["primaryColor", "options.aiThemeQuickEditPrimary"],
  ["accentColor", "options.aiThemeQuickEditAccent"],
  ["secondaryColor", "options.aiThemeQuickEditSecondary"],
] as const satisfies readonly [keyof FoliaThemeColors, string][];

export function FoliaThemeJsonTransfer({ onSelectTheme, theme }: FoliaThemeJsonTransferProps) {
  const { t } = useTranslation();
  const addTheme = useLyricStageStore((state) => state.addTheme);
  const updateTheme = useLyricStageStore((state) => state.updateTheme);
  const setThemeId = useLyricStageStore((state) => state.setThemeId);
  const themeVariant = useLyricStageStore((state) => state.themeVariant);
  const [json, setJson] = useState("");
  const [parsed, setParsed] = useState(false);
  const [importMode, setImportMode] = useState<ImportMode>("new");
  const [message, setMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 预览色块：有解析结果就用导入的颜色，否则用当前主题颜色
  const previewColors: FoliaThemeColors = parsed
    ? (() => {
        const result = parseFoliaStageThemeJson(json);
        return result ? result[themeVariant] : theme[themeVariant];
      })()
    : theme[themeVariant];

  const parsedTheme = parsed ? parseFoliaStageThemeJson(json) : null;

  // 当输入变化时解析 JSON
  useEffect(() => {
    if (!json.trim()) {
      setParsed(false);
      return;
    }
    const result = parseFoliaStageThemeJson(json);
    setParsed(!!result);
  }, [json]);

  // 复制主题 JSON
  const copyTheme = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(theme, null, 2));
      setMessage(String(t("options.copyThemeJson")));
    } catch {
      setMessage(String(t("options.copyFailed")));
    }
  };

  // 下载主题 JSON 文件
  const downloadTheme = () => {
    const data = JSON.stringify(theme, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${theme.name || "theme"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage(String(t("options.downloadThemeJson")));
  };

  // 执行导入
  const importTheme = () => {
    if (!parsedTheme) {
      setMessage(String(t("options.invalidJsonFormat")));
      return;
    }

    if (importMode === "overwrite") {
      updateTheme({
        ...parsedTheme,
        id: theme.id,
      });
      setMessage(String(t("options.themeOverwritten", { name: theme.name })));
    } else {
      addTheme(parsedTheme);
      setThemeId(parsedTheme.id);
      onSelectTheme(parsedTheme.id);
      setMessage(String(t("options.themeImported", { name: parsedTheme.name })));
    }
    setJson("");
    setParsed(false);
  };

  // 处理拖拽文件
  const handleFileDrop = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!file.name.endsWith(".json")) {
        setMessage(String(t("options.invalidJsonFormat")));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === "string") {
          setJson(text);
        }
      };
      reader.readAsText(file);
    },
    [t],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileDrop(e.dataTransfer.files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileDrop(e.target.files);
    e.target.value = "";
  };

  return (
    <div className="space-y-3">
      {/* ── 导出区 ───────────────────────────── */}
      <div className="space-y-2.5 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
        <span className="text-[10px] font-semibold tracking-[0.2em] uppercase opacity-50">
          {t("options.export")}
        </span>

        <div className="max-h-32 overflow-y-auto rounded-xl border border-white/10 bg-black/10 p-2.5">
          <pre className="font-mono text-[10px] leading-relaxed break-all whitespace-pre-wrap opacity-70">
            {JSON.stringify(theme, null, 2)}
          </pre>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void copyTheme()}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs transition hover:bg-white/10"
          >
            <Clipboard size={13} />
            {t("options.copyThemeJson")}
          </button>
          <button
            type="button"
            onClick={downloadTheme}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs transition hover:bg-white/10"
          >
            <Download size={13} />
            {t("options.downloadThemeJson")}
          </button>
        </div>
      </div>

      {/* ── 导入区 ───────────────────────────── */}
      <div className="space-y-2.5 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
        <span className="text-[10px] font-semibold tracking-[0.2em] uppercase opacity-50">
          {t("options.import")}
        </span>

        {/* 拖拽输入区 */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative cursor-pointer rounded-xl border-2 border-dashed p-3 transition-colors ${
            isDragOver
              ? "border-white/40 bg-white/10"
              : "border-white/10 bg-black/10 hover:border-white/20"
          }`}
        >
          <textarea
            value={json}
            onChange={(event) => setJson(event.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder={String(t("options.pasteJsonOrDropFile"))}
            className="h-full min-h-12 w-full resize-none bg-transparent font-mono text-[11px] outline-none placeholder:opacity-30"
            spellCheck={false}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* 色块预览 - 始终显示 */}
        <div className="space-y-1.5">
          <div className="grid grid-cols-4 gap-2">
            {COLOR_FIELDS.map(([key, label]) => (
              <div key={key} className="flex flex-col items-center gap-1">
                <div
                  className="size-8 rounded-lg border border-black/10"
                  style={{ backgroundColor: previewColors[key] }}
                />
                <span className="text-[9px] opacity-50">{t(label)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 导入方式选择 - 仅解析成功后显示 */}
        {parsed && parsedTheme && (
          <>
            <div className="text-[11px] opacity-60">
              {t("options.importThemeName")}:{" "}
              <span className="font-medium">{parsedTheme.name}</span>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase opacity-50">
                {t("options.importMode")}
              </span>
              <div className="space-y-1">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition hover:bg-white/5">
                  <input
                    type="radio"
                    name="importMode"
                    value="overwrite"
                    checked={importMode === "overwrite"}
                    onChange={() => setImportMode("overwrite")}
                    className="accent-white"
                  />
                  <span className="opacity-70">
                    {t("options.importOverwrite", { name: theme.name })}
                  </span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition hover:bg-white/5">
                  <input
                    type="radio"
                    name="importMode"
                    value="new"
                    checked={importMode === "new"}
                    onChange={() => setImportMode("new")}
                    className="accent-white"
                  />
                  <span className="opacity-70">{t("options.importAsNew")}</span>
                </label>
              </div>
            </div>
          </>
        )}

        <button
          type="button"
          onClick={importTheme}
          disabled={!parsed}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-medium transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <FileInput size={13} />
          {t("options.importThemeJson")}
        </button>
      </div>

      {message ? <p className="text-[11px] opacity-50">{message}</p> : null}
    </div>
  );
}
