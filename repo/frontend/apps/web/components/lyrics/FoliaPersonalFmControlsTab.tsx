import { FoliaPersonalFmModeMatrix } from "@/components/lyrics/FoliaPersonalFmModeMatrix";
import type { Theme } from "@/components/lyrics/folia/src/types";

interface FoliaPersonalFmControlsTabProps {
  theme: Theme;
}

export function FoliaPersonalFmControlsTab({ theme }: FoliaPersonalFmControlsTabProps) {
  return (
    <div
      className="min-h-0 max-w-full min-w-0 overflow-hidden p-4"
      style={{ width: "min(17.5rem, 100%)" }}
    >
      <FoliaPersonalFmModeMatrix compact theme={theme} />
    </div>
  );
}
