"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@scopify/ui/shadcn/components/button";
import { useI18n } from "@/store/module/i18n";
import type { ThemeEditorFrameProps } from "@/types/appearance-theme-editor";

export function ThemeEditorFrame({
  title,
  dirty,
  valid,
  onReset,
  onSave,
  actions,
  children,
}: ThemeEditorFrameProps) {
  const { t } = useI18n();
  return (
    <div className="w-full px-6 pt-24 pb-6 text-foreground md:px-10 md:pb-10">
      <header className="mb-8 border-b border-border pb-5">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground" role="status">
          {t(dirty ? "themeEditor.unsaved" : "themeEditor.draftHint")}
        </p>
      </header>
      {children}
      <footer className="mt-8 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-5">
        <Button variant="ghost" disabled={!dirty} onClick={onReset}>
          <RotateCcw />
          {t("themeEditor.reset")}
        </Button>
        {actions}
        <Button disabled={!valid} onClick={onSave}>
          {t("appearance.theme.save")}
        </Button>
      </footer>
    </div>
  );
}
