import type { LyricRenderOverride, LyricRenderQuality } from "@/components/lyrics/folia/src/types";

export type LyricRenderQualityRowsProps =
  | {
      mode: "global";
      value: LyricRenderQuality;
      onChange: (patch: Partial<LyricRenderQuality>) => void;
    }
  | {
      mode?: "override";
      value: LyricRenderOverride;
      onChange: (patch: Partial<LyricRenderOverride>) => void;
      antialias?: boolean;
    };
