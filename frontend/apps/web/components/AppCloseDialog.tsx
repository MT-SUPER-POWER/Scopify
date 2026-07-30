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
      className="animate-in fade-in fixed inset-0 z-9999 flex items-center justify-center bg-black/80 backdrop-blur-sm duration-200"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="relative flex w-100 flex-col items-center rounded-xl bg-[#282828] p-8 text-center shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-8 space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-white">{t("appClose.title")}</h2>
          <p className="text-sm text-[#b3b3b3]">{t("appClose.subtitle")}</p>
        </div>

        <div className="flex w-full flex-col gap-4">
          <button
            onClick={() => handleAction("minimize")}
            className="flex w-full flex-col items-center justify-center rounded-full bg-[#1ed760] py-3.5 transition-all hover:scale-105 hover:bg-[#1fdf64] active:scale-100"
          >
            <span className="text-base font-bold text-black">{t("appClose.minimize")}</span>
          </button>
          <button
            onClick={() => handleAction("exit")}
            className="flex w-full flex-col items-center justify-center rounded-full border border-[#727272] bg-transparent py-3.5 transition-all hover:scale-105 hover:border-white active:scale-100"
          >
            <span className="text-base font-bold text-white">{t("appClose.exit")}</span>
          </button>
        </div>

        <div
          className="group mt-8 mb-2 flex cursor-pointer items-center gap-3 select-none"
          onClick={() => setRemember((current) => !current)}
        >
          <div
            className={`flex size-4 items-center justify-center rounded-sm border transition-colors ${remember ? "border-[#1ed760] bg-[#1ed760]" : "border-[#727272] group-hover:border-white"}`}
          >
            {remember ? (
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="black"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : null}
          </div>
          <span className="text-sm text-[#b3b3b3] transition-colors group-hover:text-white">
            {t("appClose.remember")}
          </span>
        </div>
      </div>
    </div>
  );
}
