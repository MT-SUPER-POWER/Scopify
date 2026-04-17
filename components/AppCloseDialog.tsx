"use client";

import { useCallback, useEffect, useState } from "react";

import { useI18n } from "@/store/module/i18n";

export default function AppCloseDialog() {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.electronAPI) return;

    const handleCloseConfirm = () => {
      const savedAction = localStorage.getItem("app-close-action");
      if (savedAction === "minimize" || savedAction === "exit") {
        window.electronAPI?.sendAppCloseAction(savedAction);
        return;
      }
      setIsOpen(true);
    };

    window.electronAPI.on("app-close-confirm", handleCloseConfirm);
    return () => {
      window.electronAPI?.off("app-close-confirm", handleCloseConfirm);
    };
  }, []);

  const handleAction = useCallback(
    (action: "minimize" | "exit") => {
      if (remember) {
        localStorage.setItem("app-close-action", action);
      }
      window.electronAPI?.sendAppCloseAction(action);
      setIsOpen(false);
    },
    [remember],
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="bg-[#282828] w-100 rounded-xl shadow-2xl p-8 flex flex-col items-center text-center relative"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="space-y-2 mb-8">
          <h2 className="text-2xl font-bold text-white tracking-tight">{t("appClose.title")}</h2>
          <p className="text-[#b3b3b3] text-sm">{t("appClose.subtitle")}</p>
        </div>

        <div className="flex flex-col gap-4 w-full">
          <button
            onClick={() => handleAction("minimize")}
            className="flex flex-col items-center justify-center w-full py-3.5 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] hover:scale-105 transition-all active:scale-100"
          >
            <span className="text-black font-bold text-base">{t("appClose.minimize")}</span>
          </button>
          <button
            onClick={() => handleAction("exit")}
            className="flex flex-col items-center justify-center w-full py-3.5 rounded-full bg-transparent border border-[#727272] hover:border-white hover:scale-105 transition-all active:scale-100"
          >
            <span className="text-white font-bold text-base">{t("appClose.exit")}</span>
          </button>
        </div>

        <div
          className="flex items-center gap-3 mt-8 mb-2 cursor-pointer select-none group"
          onClick={() => setRemember((current) => !current)}
        >
          <div
            className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-colors ${remember ? "bg-[#1ed760] border-[#1ed760]" : "border-[#727272] group-hover:border-white"}`}
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
          <span className="text-[#b3b3b3] group-hover:text-white text-sm transition-colors">
            {t("appClose.remember")}
          </span>
        </div>
      </div>
    </div>
  );
}
