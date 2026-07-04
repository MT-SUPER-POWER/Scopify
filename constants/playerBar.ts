import { CircleDot, Radio, RadioReceiver, Sparkles } from "lucide-react";
import type { QualityOption } from "@/types/playerBar";

// ── Quality Options ───────────────────────────────────────────────────────────

export const QUALITY_OPTIONS: QualityOption[] = [
  {
    value: "spatial",
    icon: Sparkles,
    labelKey: "playbar.quality.spatial.label",
    sublabelKey: "playbar.quality.spatial.sublabel",
    descriptionKey: "playbar.quality.spatial.description",
  },
  {
    value: "lossless",
    icon: Radio,
    labelKey: "playbar.quality.lossless.label",
    sublabelKey: "playbar.quality.lossless.sublabel",
    descriptionKey: "playbar.quality.lossless.description",
  },
  {
    value: "high",
    icon: RadioReceiver,
    labelKey: "playbar.quality.high.label",
    sublabelKey: "playbar.quality.high.sublabel",
    descriptionKey: "playbar.quality.high.description",
  },
  {
    value: "standard",
    icon: CircleDot,
    labelKey: "playbar.quality.standard.label",
    sublabelKey: "playbar.quality.standard.sublabel",
    descriptionKey: "playbar.quality.standard.description",
  },
];
