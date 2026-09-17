"use client";

import { Check, Plus } from "lucide-react";
import { BACKGROUND_PRESETS } from "@/constants/appearance";
import { useAppearanceBackground } from "@/hooks/settings/useAppearanceBackground";
import { cn } from "@/lib/utils";
import { useAppearanceStore } from "@/store/module/appearance";
import { useI18n } from "@/store/module/i18n";

export function BackgroundThemePicker() {
  const { t } = useI18n();
  const { settings, palette } = useAppearanceBackground();
  const update = useAppearanceStore((state) => state.updateBackground);
  const options = [
    ...BACKGROUND_PRESETS,
    { id: "custom" as const, top: settings.customTop, bottom: settings.customBottom },
  ];
  return (
    <fieldset className="mb-8">
      <legend className="mb-4 text-base font-medium text-foreground">
        {t("appearance.presets")}
      </legend>
      <div className="grid grid-cols-3 gap-x-4 gap-y-5">
        {options.map((option) => {
          const selected = palette.id === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              onClick={() => update({ preset: option.id, rotation: "fixed" })}
              className="group min-w-0 cursor-pointer rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
            >
              <span
                className={cn(
                  "relative mb-2 flex aspect-[1.85] items-center justify-center rounded-md border transition-shadow group-hover:ring-1 group-hover:ring-content/40",
                  selected ? "border-brand ring-1 ring-brand" : "border-border",
                )}
                style={{ background: `linear-gradient(125deg, ${option.top}, ${option.bottom})` }}
              >
                {option.id === "custom" && (
                  <Plus
                    aria-hidden
                    className="size-7 rounded-full border border-white/70 p-1 text-white"
                  />
                )}
                {selected && (
                  <Check
                    aria-hidden
                    className="absolute top-2 right-2 size-5 rounded-full bg-brand p-1 text-black"
                  />
                )}
              </span>
              <span className="text-sm text-foreground">{t(`appearance.preset.${option.id}`)}</span>
            </button>
          );
        })}
      </div>
      {settings.preset === "custom" && settings.rotation === "fixed" && (
        <div className="mt-5 flex flex-wrap gap-6">
          <label className="flex cursor-pointer items-center gap-3 text-sm text-foreground">
            <input
              type="color"
              value={settings.customTop}
              onChange={(event) => update({ customTop: event.target.value })}
              className="size-8 cursor-pointer rounded border border-input bg-transparent"
            />
            {t("appearance.customTop")}
          </label>
          <label className="flex cursor-pointer items-center gap-3 text-sm text-foreground">
            <input
              type="color"
              value={settings.customBottom}
              onChange={(event) => update({ customBottom: event.target.value })}
              className="size-8 cursor-pointer rounded border border-input bg-transparent"
            />
            {t("appearance.customBottom")}
          </label>
        </div>
      )}
    </fieldset>
  );
}
