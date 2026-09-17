"use client";

import { Button } from "@scopify/ui/shadcn/components/button";
import { Switch } from "@scopify/ui/shadcn/components/switch";
import { SUBTITLE_PREVIEW_SCENES } from "@/constants/subtitle-preview";
import { useI18n } from "@/store/module/i18n";
import type { SubtitlePreviewControlsProps } from "@/types/subtitle-preview";
import { SubtitlePlaybackControls } from "./SubtitlePlaybackControls";
import { SettingRow } from "./SettingsUI";

export function SubtitlePreviewControls(props: SubtitlePreviewControlsProps) {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("subtitlePreview.scene")}>
        {(Object.keys(SUBTITLE_PREVIEW_SCENES) as (keyof typeof SUBTITLE_PREVIEW_SCENES)[]).map(
          (id) => (
            <Button
              key={id}
              size="sm"
              variant={props.activeScene === id ? "default" : "outline"}
              aria-pressed={props.activeScene === id}
              onClick={() => props.onSceneChange(id)}
            >
              {t(`subtitlePreview.${id}`)}
            </Button>
          ),
        )}
        <Button size="sm" variant="outline" onClick={props.onReplay}>
          {t("subtitlePreview.replay")}
        </Button>
      </div>
      {(["source", "target"] as const).map((field) => (
        <label key={field} className="block space-y-2 text-sm text-foreground">
          <span>{t(`subtitlePreview.${field}`)}</span>
          <textarea
            value={props.payload[field]}
            maxLength={500}
            rows={2}
            onChange={(event) =>
              props.onPayloadChange({ ...props.payload, [field]: event.target.value })
            }
            className="block w-full resize-y rounded border border-input bg-transparent px-3 py-2 outline-none focus:ring-1 focus:ring-ring"
          />
        </label>
      ))}
      <SettingRow
        label={t("subtitlePreview.isChinese")}
        control={
          <Switch
            aria-label={t("subtitlePreview.isChinese")}
            checked={props.payload.isChinese}
            onCheckedChange={(isChinese) => props.onPayloadChange({ ...props.payload, isChinese })}
          />
        }
      />
      <SettingRow
        label={t("subtitlePreview.visible")}
        control={
          <Switch
            aria-label={t("subtitlePreview.visible")}
            checked={props.visible}
            onCheckedChange={props.onVisibleChange}
          />
        }
      />
      <SettingRow
        label={t("subtitlePreview.loop")}
        control={
          <Switch
            aria-label={t("subtitlePreview.loop")}
            checked={props.loop}
            onCheckedChange={props.onLoopChange}
          />
        }
      />
      <SubtitlePlaybackControls
        playback={props.playback}
        duration={props.duration}
        loop={props.loop}
        onTogglePlayback={props.onTogglePlayback}
        onSeek={props.onSeek}
      />
    </div>
  );
}
