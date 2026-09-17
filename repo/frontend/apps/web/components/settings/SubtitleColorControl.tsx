import type { SubtitleColorControlProps } from "@/types/subtitle-preview";
import { SettingRow } from "./SettingsUI";

export function SubtitleColorControl({ label, value, onChange }: SubtitleColorControlProps) {
  return (
    <SettingRow
      label={label}
      control={
        <input
          aria-label={label}
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-16 cursor-pointer rounded border border-input bg-transparent p-1"
        />
      }
    />
  );
}
