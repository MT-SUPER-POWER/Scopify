"use client";

import { Clipboard, FileInput } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { parseFoliaStageThemeJson } from "@/lib/lyrics/foliaTheme";
import { useLyricStageStore } from "@/store/module/lyrics";
import type { FoliaThemeJsonTransferProps } from "@/types/components/lyrics";

export function FoliaThemeJsonTransfer({ onSelectTheme, theme }: FoliaThemeJsonTransferProps) {
  const { t } = useTranslation();
  const addTheme = useLyricStageStore((state) => state.addTheme);
  const setThemeId = useLyricStageStore((state) => state.setThemeId);
  const [json, setJson] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const copyTheme = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(theme, null, 2));
      setMessage(String(t("options.copyThemeJson")));
    } catch {
      setMessage(String(t("options.invalidJsonFormat")));
    }
  };

  const importTheme = () => {
    const importedTheme = parseFoliaStageThemeJson(json);
    if (!importedTheme) {
      setMessage(String(t("options.invalidJsonFormat")));
      return;
    }
    addTheme(importedTheme);
    setThemeId(importedTheme.id);
    onSelectTheme(importedTheme.id);
    setJson("");
    setMessage(importedTheme.name);
  };

  return (
    <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
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
          onClick={importTheme}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs transition hover:bg-white/10"
        >
          <FileInput size={13} />
          {t("options.importThemeJson")}
        </button>
      </div>
      <textarea
        value={json}
        onChange={(event) => setJson(event.target.value)}
        placeholder={String(t("options.pasteJsonHere"))}
        className="min-h-20 w-full resize-y rounded-xl border border-white/10 bg-black/10 p-2.5 font-mono text-[11px] transition outline-none focus:border-white/30"
        spellCheck={false}
      />
      {message ? <p className="text-[11px] opacity-50">{message}</p> : null}
    </div>
  );
}
