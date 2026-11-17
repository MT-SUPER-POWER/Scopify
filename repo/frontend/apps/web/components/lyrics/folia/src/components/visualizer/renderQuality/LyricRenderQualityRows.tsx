"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@scopify/ui/shadcn/components/select";
import { FoliaSettingsRow } from "@scopify/ui/scopify/components/folia-studio/settings";
import { useTranslation } from "react-i18next";
import { useLyricStageStore } from "@/store/module/lyrics";
import type { LyricRenderQualityRowsProps } from "@/types/lyrics/folia/renderQuality";
import {
  formatLyricRenderScale,
  LYRIC_ANTIALIAS_MODES,
  LYRIC_ANTIALIAS_OVERRIDES,
  LYRIC_RENDER_SCALES,
} from "../../../utils/lyricRenderQuality";

export const LYRIC_ANTIALIAS_LABELS = {
  auto: "folia.options.lyricRenderAntialiasAuto",
  on: "folia.options.lyricRenderAntialiasOn",
  off: "folia.options.lyricRenderAntialiasOff",
} as const;

export function LyricRenderQualityRows(props: LyricRenderQualityRowsProps) {
  const { t } = useTranslation();
  const global = useLyricStageStore((state) => state.lyricRenderQuality);
  const isGlobal = props.mode === "global";
  const followLabel = t("folia.options.lyricRenderFollowGlobal");
  const scaleLabel = t("folia.options.lyricRenderScale");
  const antialiasLabel = t("folia.options.lyricRenderAntialias");
  const antialiasModes = isGlobal ? LYRIC_ANTIALIAS_MODES : LYRIC_ANTIALIAS_OVERRIDES;

  return (
    <>
      <FoliaSettingsRow
        label={scaleLabel}
        description={
          isGlobal
            ? t("folia.options.lyricRenderScaleHint")
            : t("folia.options.lyricRenderScaleStyleHint", {
                value: formatLyricRenderScale(global.scale),
              })
        }
      >
        <Select
          value={String(props.value.scale)}
          onValueChange={(value) => {
            const scale = LYRIC_RENDER_SCALES.find((choice) => String(choice) === value);
            if (scale !== undefined) props.onChange({ scale });
            else if (props.mode !== "global" && value === "global")
              props.onChange({ scale: "global" });
          }}
        >
          <SelectTrigger aria-label={scaleLabel} className="w-fit shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {!isGlobal && <SelectItem value="global">{followLabel}</SelectItem>}
            {LYRIC_RENDER_SCALES.map((scale) => (
              <SelectItem key={scale} value={String(scale)}>
                {formatLyricRenderScale(scale)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FoliaSettingsRow>
      {(props.mode === "global" || props.antialias !== false) && (
        <FoliaSettingsRow
          label={antialiasLabel}
          description={
            isGlobal
              ? t("folia.options.lyricRenderAntialiasHint")
              : t("folia.options.lyricRenderAntialiasStyleHint", {
                  value: t(LYRIC_ANTIALIAS_LABELS[global.antialias]),
                })
          }
        >
          <Select
            value={props.value.antialias}
            onValueChange={(antialias) => {
              if (antialias === "on" || antialias === "off") props.onChange({ antialias });
              else if (props.mode === "global" && antialias === "auto")
                props.onChange({ antialias });
              else if (props.mode !== "global" && antialias === "global")
                props.onChange({ antialias });
            }}
          >
            <SelectTrigger aria-label={antialiasLabel} className="w-fit shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {antialiasModes.map((mode) => (
                <SelectItem key={mode} value={mode}>
                  {mode === "global" ? followLabel : t(LYRIC_ANTIALIAS_LABELS[mode])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FoliaSettingsRow>
      )}
    </>
  );
}
