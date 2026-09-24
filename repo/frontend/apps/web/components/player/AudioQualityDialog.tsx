"use client";
import { QualityOptionButton } from "@/components/player/QualityOptionButton";
import { IMMERSE_TYPES } from "@/constants/musicQuality";
import { QUALITY_OPTIONS } from "@/constants/playerBar";
import { useMusicQuality } from "@/hooks/player/useMusicQuality";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";

export function AudioQualityDialog() {
  const { t } = useI18n();
  const { changeMusicQuality, changeImmerseType, immerseType, musicQuality, isChanging } =
    useMusicQuality();
  return (
    <div className="space-y-3 text-content">
      <h3 className="text-sm font-semibold">{t("playbar.quality.preference")}</h3>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {QUALITY_OPTIONS.filter((option) => option.isHero).map((option) => (
          <QualityOptionButton
            key={option.value}
            option={option}
            selected={musicQuality === option.value}
            disabled={isChanging}
            onSelect={(quality) => void changeMusicQuality(quality)}
          />
        ))}
      </div>
      {musicQuality === "sky" && (
        <fieldset className="rounded-xl border border-border p-3">
          <legend className="px-1 text-xs text-content-muted">
            {t("playbar.quality.immerse")}
          </legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {IMMERSE_TYPES.map((variant) => (
              <label
                key={variant}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md p-2 text-xs",
                  immerseType === variant && "bg-primary/10 text-primary",
                )}
              >
                <input
                  type="radio"
                  name="immerse-type"
                  value={variant}
                  checked={immerseType === variant}
                  disabled={isChanging}
                  onChange={() => void changeImmerseType(variant)}
                />
                {t(`playbar.quality.immerse.${variant}`)}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <div className="space-y-1">
        {QUALITY_OPTIONS.filter((option) => !option.isHero).map((option) => (
          <QualityOptionButton
            key={option.value}
            option={option}
            selected={musicQuality === option.value}
            disabled={isChanging}
            onSelect={(quality) => void changeMusicQuality(quality)}
          />
        ))}
      </div>
      <p className="text-xs text-content-muted">{t("playbar.quality.availability")}</p>
    </div>
  );
}
