"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { DYNAMIC_ISLAND_SCALE_OPTIONS } from "@/constants/desktopCompanion";
import { useCommandWorkspaceDynamicIsland } from "@/hooks/commandWorkspace/useCommandWorkspaceDynamicIsland";
import { useTranslation } from "react-i18next";

import type { DynamicIslandTransition } from "@/types/desktop/dynamicIsland";

export function CommandWorkspaceDynamicIsland() {
  const { t } = useTranslation();
  const { preferences, update, isUpdating, error } = useCommandWorkspaceDynamicIsland();
  const toggles = [
    "enabled",
    "showTranslation",
    "snapCentered",
    "nonOcclusive",
    "alwaysOnTop",
  ] as const;
  const selectClassName =
    "rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-content outline-none [color-scheme:dark] focus-visible:ring-2 focus-visible:ring-ring/60 disabled:opacity-50";

  return (
    <>
      <ScrollArea className="h-[min(52vh,32rem)]">
        <div className="space-y-1 px-5 py-4">
          <p className="mb-4 text-xs leading-5 text-content-muted">
            调整后立即保存；关闭灵动岛时也可预先配置。
          </p>
          {!preferences ? (
            <p role="status" className="py-6 text-sm text-content-muted">
              正在读取设置…
            </p>
          ) : (
            <fieldset disabled={isUpdating} className="min-w-0 space-y-1">
              <legend className="sr-only">{t("dynamicIsland.title")}</legend>
              {toggles.map((key) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-6 border-b border-border py-3"
                >
                  <div className="min-w-0">
                    <span id={`island-${key}`} className="block text-sm font-medium text-content">
                      {t(`dynamicIsland.${key}.label`)}
                    </span>
                    {key === "enabled" || key === "snapCentered" || key === "nonOcclusive" ? (
                      <p
                        id={`island-${key}-description`}
                        className="mt-1 text-xs leading-5 text-content-muted"
                      >
                        {t(`dynamicIsland.${key}.sublabel`)}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={Boolean(preferences[key])}
                    aria-labelledby={`island-${key}`}
                    aria-describedby={
                      key === "enabled" || key === "snapCentered" || key === "nonOcclusive"
                        ? `island-${key}-description`
                        : undefined
                    }
                    onClick={() => void update({ [key]: !preferences[key] })}
                    className={`inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:opacity-50 ${preferences[key] ? "bg-brand" : "bg-content/20"}`}
                  >
                    <span
                      className={`size-5 rounded-full bg-brand-foreground shadow transition-transform ${preferences[key] ? "translate-x-5" : "translate-x-0"}`}
                    />
                  </button>
                </div>
              ))}
              <label className="flex items-center justify-between gap-6 border-b border-border py-3">
                <span className="text-sm font-medium text-content">
                  {t("dynamicIsland.transition.label")}
                </span>
                <select
                  className={selectClassName}
                  value={preferences.transition}
                  onChange={(event) =>
                    void update({ transition: event.target.value as DynamicIslandTransition })
                  }
                >
                  <option value="bounce">{t("dynamicIsland.transition.bounce")}</option>
                  <option value="smooth">{t("dynamicIsland.transition.smooth")}</option>
                </select>
              </label>
              <label className="flex items-center justify-between gap-6 py-3">
                <span className="text-sm font-medium text-content">
                  {t("dynamicIsland.scale.label")}
                </span>
                <select
                  className={selectClassName}
                  value={String(preferences.scale)}
                  onChange={(event) => void update({ scale: Number(event.target.value) })}
                >
                  {DYNAMIC_ISLAND_SCALE_OPTIONS.map((scale) => (
                    <option key={scale} value={String(scale)}>
                      {Math.round(scale * 100)}%
                    </option>
                  ))}
                </select>
              </label>
            </fieldset>
          )}
          {error ? (
            <p role="alert" className="py-2 text-xs text-red-300">
              {error}
            </p>
          ) : null}
        </div>
      </ScrollArea>
      <footer className="border-t border-border px-5 py-3 text-xs text-content-muted">
        Tab 切换选项 · 空格切换开关 · Esc 返回
      </footer>
    </>
  );
}
