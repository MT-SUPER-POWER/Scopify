import { FoliaPersonalFmModeMatrix } from "@/components/lyrics/FoliaPersonalFmModeMatrix";
import type { Theme } from "@/components/lyrics/folia/src/types";

interface FoliaPersonalFmControlsTabProps {
  theme: Theme;
}

export function FoliaPersonalFmControlsTab({ theme }: FoliaPersonalFmControlsTabProps) {
  return (
    <div className="min-h-0 p-4">
      <FoliaPersonalFmModeMatrix compact theme={theme} />
    </div>
  );
}
