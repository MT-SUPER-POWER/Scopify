"use client";

import { RotateCcw } from "lucide-react";
import { Badge } from "@scopify/ui/shadcn/components/badge";
import { Button } from "@scopify/ui/shadcn/components/button";
import { useI18n } from "@/store/module/i18n";
import type { ThemeEditorFrameProps } from "@/types/appearance-theme-editor";

export function ThemeEditorFrame({
  title,
  readOnly = false,
  saved = false,
  missing = false,
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
      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
            {title}
          </h1>
          {readOnly && !missing && (
            <Badge variant="secondary">{t("themeEditor.builtinHint")}</Badge>
          )}
        </div>
        {(!readOnly || missing) && (
          <p className="mt-1 text-sm text-muted-foreground" role="status">
            {t(
              missing
                ? "themeEditor.missing"
                : dirty
                  ? "themeEditor.unsaved"
                  : saved
                    ? "themeEditor.saved"
                    : "themeEditor.draftHint",
            )}
          </p>
        )}
      </header>
      {children}
      {!missing && (
        <footer className="mt-8 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-5">
          {!readOnly && (
            <Button variant="ghost" disabled={!dirty} onClick={onReset}>
              <RotateCcw />
              {t("themeEditor.reset")}
            </Button>
          )}
          {actions}
          {!readOnly && (
            <Button disabled={!valid} onClick={onSave}>
              {t("appearance.theme.save")}
            </Button>
          )}
        </footer>
      )}
    </div>
  );
}
