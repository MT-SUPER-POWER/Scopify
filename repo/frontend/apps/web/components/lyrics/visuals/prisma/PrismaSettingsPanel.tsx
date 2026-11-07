import React from "react";
import type { TranslationKey } from "@/lib/i18n";
import {
  DEFAULT_PRISMA_TUNING,
  PRISMA_LIMITS,
  type PrismaNumberKey,
} from "@/types/lyrics/prisma/model";
import type { VisualizerSettingsPanelProps } from "../../folia/src/components/visualizer/definition";
import {
  Group,
  PanelFrame,
  percent,
  SliderRow,
  times,
  ToggleRow,
  type SettingsGroupDef,
} from "../../folia/src/components/visualizer/panelRows";

// components/lyrics/prisma/PrismaSettingsPanel.tsx
// 聚散's settings: how the shards look and fly, how much of a line shows before it is sung, and the music.

const pixels = (value: number) => `${Math.round(value)}px`;

type SliderSpec = [PrismaNumberKey, TranslationKey, number, (value: number) => string];

const SHARDS_GROUP: SettingsGroupDef = {
  id: "vis-prisma-shards",
  titleKey: "folia.options.prismaShards",
};
const SHARD_SLIDERS: SliderSpec[] = [
  ["shardSize", "folia.options.prismaShardSize", 1, pixels],
  ["burst", "folia.options.prismaBurst", 0.05, times],
  ["flow", "folia.options.prismaFlow", 0.05, times],
  ["swarm", "folia.options.prismaSwarm", 0.01, percent],
  ["audio", "folia.options.prismaAudio", 0.05, times],
  ["gloss", "folia.options.prismaGloss", 0.05, times],
];

const PrismaSettingsPanel: React.FC<VisualizerSettingsPanelProps> = ({
  t,
  isDaylight,
  theme,
  controlCardBg,
  rangeInputClass,
  prismaTuning,
  onPrismaTuningChange,
  onSliderPointerDown,
  onSliderCommit,
}) => {
  const resolved = prismaTuning ?? DEFAULT_PRISMA_TUNING;
  return (
    <PanelFrame
      title={t("folia.ui.visualizerPrisma")}
      t={t}
      isDaylight={isDaylight}
      theme={theme}
      controlCardBg={controlCardBg}
      rangeInputClass={rangeInputClass}
    >
      <Group def={SHARDS_GROUP}>
        {SHARD_SLIDERS.map(([key, labelKey, step, format]) => (
          <SliderRow
            key={key}
            onDragStart={onSliderPointerDown}
            onDragEnd={onSliderCommit}
            label={t(labelKey)}
            value={resolved[key]}
            min={PRISMA_LIMITS[key].min}
            max={PRISMA_LIMITS[key].max}
            step={step}
            format={format}
            onChange={(value) => onPrismaTuningChange?.({ [key]: value })}
          />
        ))}
        <ToggleRow
          label={t("folia.options.prismaShowTitle")}
          note={t("folia.options.prismaShowTitleHint")}
          checked={resolved.showTitle}
          onChange={(showTitle) => onPrismaTuningChange?.({ showTitle })}
        />
      </Group>
    </PanelFrame>
  );
};

export default PrismaSettingsPanel;
