"use client";

import { useCallback, useEffect, useState } from "react";

import { runtime } from "@/lib/runtime";
import { useI18n } from "@/store/module/i18n";

export default function AppCloseDialog() {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    if (!runtime.isDesktop) return;

    const handleCloseConfirm = () => {
      const savedAction = localStorage.getItem("app-close-action");
      if (savedAction === "minimize" || savedAction === "exit") {
        runtime.app.submitCloseAction(savedAction);
        return;
      }
      setIsOpen(true);
    };

    return runtime.app.onCloseRequested(handleCloseConfirm);
  }, []);

  const handleAction = useCallback(
    (action: "minimize" | "exit") => {
      if (remember) {
        localStorage.setItem("app-close-action", action);
      }
      runtime.app.submitCloseAction(action);
      setIsOpen(false);
    },
    [remember],
  );

  if (!isOpen) return null;

  return (
    <div
      className="bg-overlay animate-in fade-in fixed inset-0 z-9999 flex items-center justify-center backdrop-blur-sm duration-200"
      onClick={() => setIsOpen(false)}
    >
      <div
        aria-describedby="app-close-description"
        aria-labelledby="app-close-title"
        aria-modal="true"
        role="dialog"
        className="bg-surface-overlay text-content shadow-floating border-border relative flex w-100 flex-col items-center rounded-xl border p-8 text-center"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-8 space-y-2">
          <h2 id="app-close-title" className="text-content text-2xl font-bold tracking-tight">
            {t("appClose.title")}
          </h2>
          <p id="app-close-description" className="text-content-muted text-sm">
            {t("appClose.subtitle")}
          </p>
        </div>

        <div className="flex w-full flex-col gap-4">
          <button
            type="button"
            onClick={() => handleAction("minimize")}
            className="bg-brand hover:bg-brand-hover flex w-full flex-col items-center justify-center rounded-full py-3.5 transition-all hover:scale-105 active:scale-100"
          >
            <span className="text-brand-foreground text-base font-bold">
              {t("appClose.minimize")}
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleAction("exit")}
            className="border-content-subtle text-content hover:border-content hover:bg-content/5 flex w-full flex-col items-center justify-center rounded-full border bg-transparent py-3.5 transition-all hover:scale-105 active:scale-100"
          >
            <span className="text-base font-bold">{t("appClose.exit")}</span>
          </button>
        </div>

        <button
          type="button"
          role="checkbox"
          aria-checked={remember}
          className="group mt-8 mb-2 flex cursor-pointer items-center gap-3 select-none"
          onClick={() => setRemember((current) => !current)}
        >
          <div
            className={`flex size-4 items-center justify-center rounded-sm border transition-colors ${remember ? "border-brand bg-brand" : "border-content-subtle group-hover:border-content"}`}
          >
            {remember ? (
              <svg
                className="text-brand-foreground"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : null}
          </div>
          <span className="text-content-muted group-hover:text-content text-sm transition-colors">
            {t("appClose.remember")}
          </span>
        </button>
      </div>
    </div>
  );
}
