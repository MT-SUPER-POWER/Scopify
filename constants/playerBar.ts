import { CircleDot, Disc, Disc3, Gem, Radio, RadioReceiver, Sliders, Sparkles } from "lucide-react";
import type { QualityOption } from "@/types/playerBar";

// ── Quality Options ───────────────────────────────────────────────────────────

export const QUALITY_OPTIONS: QualityOption[] = [
  // ── 顶部 2 个 Hero 旗舰大卡片 (SVIP) ──
  {
    value: "sky",
    icon: Disc3,
    badgeType: "svip",
    isHero: true,
    labelKey: "playbar.quality.sky.label",
    sublabelKey: "playbar.quality.sky.sublabel",
    techSpec: "playbar.quality.sky.description",
  },
  {
    value: "jymaster",
    icon: Disc,
    badgeType: "svip",
    isHero: true,
    labelKey: "playbar.quality.jymaster.label",
    sublabelKey: "playbar.quality.jymaster.sublabel",
    techSpec: "playbar.quality.jymaster.description",
  },

  // ── 列表音质 (SVIP / VIP / 普通) ──
  {
    value: "dolby",
    icon: Gem,
    badgeType: "svip",
    labelKey: "playbar.quality.dolby.label",
    techSpec: "playbar.quality.dolby.description",
  },
  {
    value: "spatial",
    icon: Sliders,
    badgeType: "vip",
    labelKey: "playbar.quality.spatial.label",
    techSpec: "playbar.quality.spatial.description",
  },
  {
    value: "hires",
    icon: Sparkles,
    badgeType: "vip",
    labelKey: "playbar.quality.hires.label",
    techSpec: "playbar.quality.hires.description",
    shortLabel: "H",
  },
  {
    value: "lossless",
    icon: Radio,
    badgeType: "vip",
    labelKey: "playbar.quality.lossless.label",
    techSpec: "playbar.quality.lossless.description",
    shortLabel: "SQ",
  },
  {
    value: "high",
    icon: RadioReceiver,
    labelKey: "playbar.quality.high.label",
    techSpec: "playbar.quality.high.description",
    shortLabel: "HQ",
  },
  {
    value: "standard",
    icon: CircleDot,
    labelKey: "playbar.quality.standard.label",
    techSpec: "playbar.quality.standard.description",
    shortLabel: "标",
  },
];
