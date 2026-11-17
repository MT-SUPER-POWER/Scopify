import React from "react";
import type { TranslationKey } from "@/lib/i18n";
import { type VisualizerSettingsPanelProps } from "../definition";
import {
  Group,
  PanelFrame,
  percent,
  Row,
  Segmented,
  SliderRow,
  times,
  ToggleRow,
  type SettingsGroupDef,
} from "../panelRows";
import { LyricRenderQualityRows } from "../renderQuality/LyricRenderQualityRows";
import {
  DEFAULT_NEBBIA_TUNING,
  NEBBIA_APPEAR_STYLES,
  NEBBIA_BEHIND,
  NEBBIA_FADE_STYLES,
  NEBBIA_GLASS,
  NEBBIA_LAYOUTS,
  NEBBIA_LIMITS,
  NEBBIA_RAIN,
  NEBBIA_SCENERY,
  type NebbiaAppearStyle,
  type NebbiaFadeStyle,
  type NebbiaLayout,
  type NebbiaNumberKey,
  type NebbiaTuning,
} from "./types";

// src/components/visualizer/nebbia/NebbiaSettingsPanel.tsx
// 雾笺的设置：最上面是窗外（选背景：街景、梦海流萤或共用背景，连同窗外画哪几样），然后是雾上写字（笔画、手写歪斜和变形、雾、片尾写曲名），字怎么出现、怎么消失、一句怎么构图（每种一个开关，开几种用几种），
// 窗外（车、霓虹、聚光灯），窗外画哪几样在最上面那组（聚光灯、楼群、光斑、车灯、马路各一个开关，雨斜着、竖直或不下），渲染（分辨率，
// 默认跟随全局）。用设置窗口的共用控件画成几组。
// 窗外选了水族箱时多三个滑块（水母数量、大小、气泡多少），开关和雨换成水族箱的说法（同一组位，见 nebbiaAquaGlsl.ts）。
// 前面雾玻璃上的水单独一组：雨窗（小雨点密度、大雨点大小）、凝露（冷凝水珠多少、大小、高光）或融雪；窗外场景与玻璃分别调整。

export const NEBBIA_APPEAR_LABEL_KEYS: Record<NebbiaAppearStyle, TranslationKey> = {
  write: "folia.options.nebbiaAppearWrite",
  fade: "folia.options.nebbiaAppearFade",
  breath: "folia.options.nebbiaAppearBreath",
};
export const NEBBIA_FADE_LABEL_KEYS: Record<NebbiaFadeStyle, TranslationKey> = {
  fog: "folia.options.nebbiaFadeFog",
  fingers: "folia.options.nebbiaFadeFingers",
};
const LAYOUT_LABEL_KEYS = Object.fromEntries(
  NEBBIA_LAYOUTS.map((l) => [l, `folia.options.nebbiaLayout_${l}`]),
) as Record<NebbiaLayout, TranslationKey>;

const seconds = (value: number) => `${value.toFixed(1)}s`;
const count = (value: number) => String(Math.round(value));
type SliderSpec = [NebbiaNumberKey, TranslationKey, number, (value: number) => string];

const WRITING_GROUP: SettingsGroupDef = {
  id: "vis-nebbia-writing",
  titleKey: "folia.options.nebbiaWriting",
};
const WRITING_SLIDERS: SliderSpec[] = [
  ["strokeWidth", "folia.options.nebbiaStrokeWidth", 0.005, percent],
  ["writeSpeed", "folia.options.nebbiaWriteSpeed", 0.05, times],
  ["jitter", "folia.options.nebbiaJitter", 0.05, times],
  ["warp", "folia.options.nebbiaWarp", 0.05, times],
  ["doodle", "folia.options.nebbiaDoodle", 0.05, percent],
  ["mist", "folia.options.nebbiaMist", 0.01, percent],
  ["hold", "folia.options.nebbiaHold", 0.1, seconds],
  ["refog", "folia.options.nebbiaRefog", 0.5, seconds],
];
const WINDOW_GROUP: SettingsGroupDef = {
  id: "vis-nebbia-window",
  titleKey: "folia.options.nebbiaWindow",
};
const WINDOW_SLIDERS: SliderSpec[] = [
  ["busSpeed", "folia.options.nebbiaBusSpeed", 0.05, times],
  ["neon", "folia.options.nebbiaNeon", 0.05, times],
  ["bump", "folia.options.nebbiaBump", 0.05, times],
  ["spot", "folia.options.nebbiaSpot", 0.05, times],
  ["spotX", "folia.options.nebbiaSpotX", 0.01, percent],
];
// 分辨率（#929）：原来窗外一组里的分辨率滑块换成共用的「跟随全局 / 指定倍数」；全屏着色器没有 MSAA，不出抗锯齿那行。
const RENDER_GROUP: SettingsGroupDef = {
  id: "vis-nebbia-render",
  titleKey: "folia.options.lyricRenderSection",
};
/** 水族箱里车不颠：这条不显示。 */
const NOT_IN_AQUARIUM: readonly NebbiaNumberKey[] = ["bump"];
const AQUA_WINDOW_SLIDERS = WINDOW_SLIDERS.filter(([key]) => !NOT_IN_AQUARIUM.includes(key));
const AQUA_SLIDERS: SliderSpec[] = [
  ["jellies", "folia.options.nebbiaJellies", 1, count],
  ["jellySize", "folia.options.nebbiaJellySize", 0.05, times],
  ["bubbles", "folia.options.nebbiaBubbles", 0.05, percent],
];
const GLASS_GROUP: SettingsGroupDef = {
  id: "vis-nebbia-glass",
  titleKey: "folia.options.nebbiaGlass",
};
const GLASS_SLIDERS: Record<NebbiaTuning["glass"], SliderSpec[]> = {
  rain: [
    ["rainHit", "folia.options.nebbiaRainHit", 0.05, times],
    ["rainBig", "folia.options.nebbiaRainBig", 0.05, times],
  ],
  dew: [
    ["dew", "folia.options.nebbiaDew", 0.05, times],
    ["dewSize", "folia.options.nebbiaDewSize", 0.05, times],
    ["dewGlint", "folia.options.nebbiaDewGlint", 0.05, times],
  ],
  snow: [
    ["snow", "folia.options.nebbiaSnow", 0.05, times],
    ["snowSize", "folia.options.nebbiaSnowSize", 0.05, times],
    ["snowMelt", "folia.options.nebbiaSnowMelt", 0.05, times],
  ],
};
const APPEAR_GROUP: SettingsGroupDef = {
  id: "vis-nebbia-appear",
  titleKey: "folia.options.nebbiaAppear",
};
const FADE_GROUP: SettingsGroupDef = {
  id: "vis-nebbia-fade",
  titleKey: "folia.options.nebbiaFade",
};
const LAYOUT_GROUP: SettingsGroupDef = {
  id: "vis-nebbia-layouts",
  titleKey: "folia.options.nebbiaLayouts",
};
const SCENERY_GROUP: SettingsGroupDef = {
  id: "vis-nebbia-scenery",
  titleKey: "folia.options.nebbiaScenery",
};

/** 开关组里打开或关掉一项，按 choices 的顺序排；全关了返回 null（最后一项关不掉）。 */
const toggled = <T extends string>(
  choices: readonly T[],
  on: readonly T[],
  item: T,
  next: boolean,
): T[] | null => {
  const out = choices.filter((c) => (c === item ? next : on.includes(c)));
  return out.length ? out : null;
};

const NebbiaSettingsPanel: React.FC<VisualizerSettingsPanelProps> = ({
  t,
  isDaylight,
  theme,
  controlCardBg,
  rangeInputClass,
  nebbiaTuning,
  onNebbiaTuningChange,
  onSliderPointerDown,
  onSliderCommit,
}) => {
  const resolved = nebbiaTuning ?? DEFAULT_NEBBIA_TUNING;
  const onTuningChange = (patch: Partial<NebbiaTuning>) => onNebbiaTuningChange?.(patch);
  const drag = { onDragStart: onSliderPointerDown, onDragEnd: onSliderCommit };
  const aquarium = resolved.behind === "aquarium";
  // 开关和雨的文案：水族箱换一套说法
  const sceneryKey = aquarium ? "folia.options.nebbiaAquaScenery" : "folia.options.nebbiaScenery";
  const rainKey = aquarium ? "folia.options.nebbiaAquaRain" : "folia.options.nebbiaRain";
  const sliders = (specs: SliderSpec[]) =>
    specs.map(([key, labelKey, step, format]) => (
      <SliderRow
        key={key}
        {...drag}
        label={t(labelKey)}
        value={resolved[key]}
        min={NEBBIA_LIMITS[key].min}
        max={NEBBIA_LIMITS[key].max}
        step={step}
        format={format}
        onChange={(value) => onTuningChange({ [key]: value } as Partial<NebbiaTuning>)}
      />
    ));
  // 一组开关：on 是打开的几项，patch 把新的一组写回 tuning；只剩一项时它的开关不能点
  const toggles = <T extends string>(
    choices: readonly T[],
    on: readonly T[],
    labels: Record<T, TranslationKey>,
    patch: (next: T[]) => Partial<NebbiaTuning>,
  ) =>
    choices.map((item) => (
      <ToggleRow
        key={item}
        label={t(labels[item])}
        checked={on.includes(item)}
        disabled={on.length === 1 && on[0] === item}
        onChange={(next) => {
          const list = toggled(choices, on, item, next);
          if (list) onTuningChange(patch(list));
        }}
      />
    ));

  return (
    <PanelFrame
      title={t("folia.ui.visualizerNebbia")}
      t={t}
      isDaylight={isDaylight}
      theme={theme}
      controlCardBg={controlCardBg}
      rangeInputClass={rangeInputClass}
    >
      <Group def={SCENERY_GROUP} foot={t(`${sceneryKey}Hint`)}>
        <Row label={t("folia.options.nebbiaBehind")} note={t("folia.options.nebbiaBehindHint")}>
          <Segmented<NebbiaTuning["behind"]>
            value={resolved.behind}
            options={NEBBIA_BEHIND.map((behind) => ({
              value: behind,
              label: t(`folia.options.nebbiaBehind_${behind}`),
            }))}
            onChange={(behind) => onTuningChange({ behind })}
          />
        </Row>
        {aquarium && sliders(AQUA_SLIDERS)}
        {/* 窗外用共用背景时街景不画，下面几项看不出来（聚光灯照在雾上的那圈光还在） */}
        {NEBBIA_SCENERY.map((part) => (
          <ToggleRow
            key={part}
            disabled={resolved.behind === "backdrop" && part !== "spot"}
            label={t(`${sceneryKey}_${part}`)}
            checked={resolved.scenery.includes(part)}
            onChange={(next) =>
              onTuningChange({
                scenery: NEBBIA_SCENERY.filter((c) =>
                  c === part ? next : resolved.scenery.includes(c),
                ),
              })
            }
          />
        ))}
        {/* 街景的雨只画在聚光灯光柱里（被照亮的雨丝），聚光灯关着或强度为 0 时这项看不出来；水族箱的细气泡不看聚光灯；雪窗时街景窗外不下雨，这项不管用 */}
        <Row label={t(rainKey)} note={t(`${rainKey}Hint`)}>
          <fieldset
            disabled={
              resolved.behind === "backdrop" ||
              (!aquarium &&
                (resolved.glass === "snow" ||
                  !resolved.scenery.includes("spot") ||
                  resolved.spot <= 0))
            }
            className="min-w-0 disabled:opacity-45"
          >
            <Segmented<NebbiaTuning["rain"]>
              value={resolved.rain}
              options={NEBBIA_RAIN.map((rain) => ({ value: rain, label: t(`${rainKey}_${rain}`) }))}
              onChange={(rain) => onTuningChange({ rain })}
            />
          </fieldset>
        </Row>
      </Group>
      <Group def={WRITING_GROUP}>
        {sliders(WRITING_SLIDERS)}
        <ToggleRow
          label={t("folia.options.nebbiaCredits")}
          note={t("folia.options.nebbiaCreditsHint")}
          checked={resolved.credits}
          onChange={(credits) => onTuningChange({ credits })}
        />
      </Group>
      <Group def={APPEAR_GROUP} foot={t("folia.options.nebbiaAppearHint")}>
        {toggles(NEBBIA_APPEAR_STYLES, resolved.appear, NEBBIA_APPEAR_LABEL_KEYS, (appear) => ({
          appear,
        }))}
      </Group>
      <Group def={FADE_GROUP} foot={t("folia.options.nebbiaFadeHint")}>
        {toggles(NEBBIA_FADE_STYLES, resolved.fade, NEBBIA_FADE_LABEL_KEYS, (fade) => ({ fade }))}
      </Group>
      <Group def={LAYOUT_GROUP} foot={t("folia.options.nebbiaLayoutsHint")}>
        {toggles(NEBBIA_LAYOUTS, resolved.layouts, LAYOUT_LABEL_KEYS, (layouts) => ({ layouts }))}
      </Group>
      <Group def={WINDOW_GROUP}>{sliders(aquarium ? AQUA_WINDOW_SLIDERS : WINDOW_SLIDERS)}</Group>
      <Group def={GLASS_GROUP}>
        <Row label={t("folia.options.nebbiaGlassStyle")} note={t("folia.options.nebbiaGlassHint")}>
          <Segmented<NebbiaTuning["glass"]>
            value={resolved.glass}
            options={NEBBIA_GLASS.map((glass) => ({
              value: glass,
              label: t(`folia.options.nebbiaGlass_${glass}`),
            }))}
            onChange={(glass) => onTuningChange({ glass })}
          />
        </Row>
        {sliders(GLASS_SLIDERS[resolved.glass])}
      </Group>
      <Group def={RENDER_GROUP}>
        <LyricRenderQualityRows
          value={resolved.render}
          onChange={(patch) => onTuningChange({ render: { ...resolved.render, ...patch } })}
          antialias={false}
        />
      </Group>
    </PanelFrame>
  );
};

export default NebbiaSettingsPanel;
