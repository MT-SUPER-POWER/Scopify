import { useSubtitlePreview } from "@/hooks/settings/useSubtitlePreview";
import type { SubtitlePaletteEditorProps } from "@/types/subtitle-preview";
import { LyricsStylePreview } from "./LyricsStylePreview";
import { SubtitlePaletteFields } from "./SubtitlePaletteFields";

export function SubtitlePaletteEditor({ settings, onChange }: SubtitlePaletteEditorProps) {
  const update = (patch: Partial<typeof settings>) => onChange({ ...settings, ...patch });
  const preview = useSubtitlePreview(settings, update);
  return (
    <div className="space-y-6">
      <LyricsStylePreview
        settings={settings}
        payload={preview.payload}
        replayId={preview.replayId}
        visible={preview.visible}
        playback={preview.playback}
        loop={preview.loop}
      />
      <SubtitlePaletteFields settings={settings} onChange={update} />
    </div>
  );
}
