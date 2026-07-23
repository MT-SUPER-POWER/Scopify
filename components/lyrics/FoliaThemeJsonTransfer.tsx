"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { FoliaThemeJsonExport } from "@/components/lyrics/FoliaThemeJsonExport";
import { FoliaThemeJsonImport } from "@/components/lyrics/FoliaThemeJsonImport";
import { parseFoliaStageThemeJson } from "@/lib/lyrics/foliaTheme";
import { useLyricStageStore } from "@/store/module/lyrics";
import type {
  FoliaThemeImportMode,
  FoliaThemeJsonTransferProps,
  FoliaThemeJsonValidation,
} from "@/types/components/lyrics";

export function FoliaThemeJsonTransfer({ onSelectTheme, theme }: FoliaThemeJsonTransferProps) {
  const { t } = useTranslation();
  const addTheme = useLyricStageStore((state) => state.addTheme);
  const updateTheme = useLyricStageStore((state) => state.updateTheme);
  const setThemeId = useLyricStageStore((state) => state.setThemeId);
  const themeVariant = useLyricStageStore((state) => state.themeVariant);
  const [json, setJson] = useState("");
  const [importMode, setImportMode] = useState<FoliaThemeImportMode>("new");
  const [isDragOver, setIsDragOver] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const themeJson = useMemo(() => JSON.stringify(theme, null, 2), [theme]);
  const parsedTheme = useMemo(() => (json.trim() ? parseFoliaStageThemeJson(json) : null), [json]);
  const validation: FoliaThemeJsonValidation = !json.trim()
    ? "empty"
    : parsedTheme
      ? "valid"
      : "invalid";
  const previewColors = parsedTheme?.[themeVariant] ?? theme[themeVariant];

  const updateJson = (value: string) => {
    setJson(value);
    setMessage(null);
  };

  const copyTheme = async () => {
    try {
      await navigator.clipboard.writeText(themeJson);
      setMessage(String(t("options.copyThemeJson")));
    } catch {
      setMessage(String(t("options.copyFailed")));
    }
  };

  const downloadTheme = () => {
    const blob = new Blob([themeJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${theme.name || "theme"}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage(String(t("options.downloadThemeJson")));
  };

  const importTheme = () => {
    if (!parsedTheme) {
      setMessage(String(t("options.invalidJsonFormat")));
      return;
    }

    if (importMode === "overwrite") {
      updateTheme({ ...parsedTheme, id: theme.id });
      setMessage(String(t("options.themeOverwritten", { name: theme.name })));
    } else {
      addTheme(parsedTheme);
      setThemeId(parsedTheme.id);
      onSelectTheme(parsedTheme.id);
      setMessage(String(t("options.themeImported", { name: parsedTheme.name })));
    }
    setJson("");
  };

  const readFile = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      if (!file.name.toLowerCase().endsWith(".json")) {
        setMessage(String(t("options.invalidJsonFormat")));
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === "string") updateJson(event.target.result);
      };
      reader.readAsText(file);
    },
    [t],
  );

  return (
    <div className="space-y-3">
      <FoliaThemeJsonExport
        colors={theme[themeVariant]}
        json={themeJson}
        onCopy={() => void copyTheme()}
        onDownload={downloadTheme}
      />
      <FoliaThemeJsonImport
        colors={previewColors}
        currentThemeName={theme.name}
        fileInputRef={fileInputRef}
        importMode={importMode}
        isDragOver={isDragOver}
        json={json}
        onDragLeave={() => setIsDragOver(false)}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragOver(false);
          readFile(event.dataTransfer.files);
        }}
        onFileSelect={(event) => {
          readFile(event.target.files);
          event.target.value = "";
        }}
        onImport={importTheme}
        onImportModeChange={setImportMode}
        onJsonChange={updateJson}
        themeName={parsedTheme?.name ?? null}
        validation={validation}
      />
      {message ? (
        <p className="px-1 text-[11px] opacity-60" style={{ color: previewColors.secondaryColor }}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
