"use client";

import { ArrowLeft, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@scopify/ui/shadcn/components/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@scopify/ui/shadcn/components/alert-dialog";
import { useI18n } from "@/store/module/i18n";
import type { ThemeEditorFrameProps } from "@/types/appearance-theme-editor";

export function ThemeEditorFrame({
  title,
  returnHref,
  dirty,
  valid,
  onReset,
  onSave,
  actions,
  children,
}: ThemeEditorFrameProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const leave = () => router.push(returnHref);
  return (
    <div className="w-full p-6 text-foreground md:p-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("themeEditor.back")}
            title={t("themeEditor.back")}
            onClick={() => (dirty ? setLeaving(true) : leave())}
          >
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground" role="status">
              {t(dirty ? "themeEditor.unsaved" : "themeEditor.draftHint")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          <Button variant="ghost" disabled={!dirty} onClick={onReset}>
            <RotateCcw />
            {t("themeEditor.reset")}
          </Button>
          <Button disabled={!valid} onClick={onSave}>
            {t("appearance.theme.save")}
          </Button>
        </div>
      </header>
      {children}
      <AlertDialog open={leaving} onOpenChange={setLeaving}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("themeEditor.leaveTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("themeEditor.leaveHint")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("themeEditor.keepEditing")}</AlertDialogCancel>
            <AlertDialogAction onClick={leave}>{t("themeEditor.discard")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
