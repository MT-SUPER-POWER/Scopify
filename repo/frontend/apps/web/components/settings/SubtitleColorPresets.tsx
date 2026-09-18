import { Button } from "@scopify/ui/shadcn/components/button";
import { SUBTITLE_COLOR_PRESETS } from "@/constants/subtitle-preview";
import { useI18n } from "@/store/module/i18n";
import type { SubtitleSettingsEditorProps } from "@/types/subtitle-preview";

export function SubtitleColorPresets({ settings, onChange }: SubtitleSettingsEditorProps) {
  const { t } = useI18n();
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {SUBTITLE_COLOR_PRESETS.map(({ id, ...palette }) => {
        const active =
          settings.color === palette.color &&
          settings.gradientColor === palette.gradientColor &&
          settings.colorMode === palette.colorMode;
        return (
          <Button
            key={id}
            variant={active ? "secondary" : "outline"}
            size="sm"
            aria-pressed={active}
            onClick={() => onChange(palette)}
          >
            <span
              className="size-3 rounded-full"
              style={{
                background: `linear-gradient(90deg, ${palette.color}, ${palette.gradientColor})`,
              }}
            />
            {t(`subtitlePreview.${id}`)}
          </Button>
        );
      })}
    </div>
  );
}
