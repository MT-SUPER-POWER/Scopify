"use client";

import { X } from "lucide-react";

import { AppCloseActions } from "@/components/appClose/AppCloseActions";
import { AppCloseHeader } from "@/components/appClose/AppCloseHeader";
import { AppCloseRememberChoice } from "@/components/appClose/AppCloseRememberChoice";
import { useAppCloseState } from "@/hooks/appClose/useAppCloseState";
import { useI18n } from "@/store/module/i18n";

export default function AppClosePage() {
  const { t } = useI18n();
  const { isSubmitting, remember, setRemember, submitAction } = useAppCloseState();

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `html, body { background-color: transparent !important; }`,
        }}
      />
      <main
        className="size-full bg-transparent p-1 text-content"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        <section
          aria-describedby="app-close-description"
          aria-labelledby="app-close-title"
          className="relative flex size-full flex-col items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-overlay p-8"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          <button
            type="button"
            onClick={() => void submitAction("cancel")}
            className="absolute top-4 right-4 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label={t("ui.close")}
          >
            <X className="size-4" />
          </button>

          <div className="flex w-full max-w-sm flex-col items-center gap-8">
            <AppCloseHeader title={t("appClose.title")} subtitle={t("appClose.subtitle")} />
            <AppCloseActions
              disabled={isSubmitting}
              minimizeLabel={t("appClose.minimize")}
              exitLabel={t("appClose.exit")}
              onAction={(action) => void submitAction(action)}
            />
            <AppCloseRememberChoice
              checked={remember}
              label={t("appClose.remember")}
              onCheckedChange={setRemember}
            />
          </div>
        </section>
      </main>
    </>
  );
}
