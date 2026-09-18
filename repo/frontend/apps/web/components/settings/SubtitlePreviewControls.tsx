"use client";

import { Button } from "@scopify/ui/shadcn/components/button";
import { Textarea } from "@scopify/ui/shadcn/components/textarea";
import { useId } from "react";
import { SUBTITLE_PREVIEW_SCENES } from "@/constants/subtitle-preview";
import { useI18n } from "@/store/module/i18n";
import type { SubtitlePreviewControlsProps } from "@/types/subtitle-preview";

export function SubtitlePreviewControls(props: SubtitlePreviewControlsProps) {
  const { t } = useI18n();
  const id = useId();
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
      </div>
      {(["source", "target"] as const).map((field) => (
        <div key={field} className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor={`${id}-${field}`} className="text-base font-medium text-foreground">
              {t(`subtitlePreview.${field}`)}
            </label>
            {field === "source" && props.payload.isChinese && (
              <span className="text-xs text-muted-foreground">
                {t("subtitlePreview.isChinese")}
              </span>
            )}
          </div>
          <Textarea
            id={`${id}-${field}`}
            value={props.payload[field]}
            maxLength={500}
            rows={2}
            onChange={(event) =>
              props.onPayloadChange({ ...props.payload, [field]: event.target.value })
            }
            className="field-sizing-fixed resize-y"
          />
        </div>
      ))}
    </div>
  );
}
