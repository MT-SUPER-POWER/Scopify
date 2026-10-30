import React, { useEffect, useId, useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw, X } from "lucide-react";
import type { TranslationKey } from "@/lib/i18n";
import type { Theme } from "../../../types";
import { percent, times } from "../panelRows";
import {
  apertureReadout,
  MACHI_APERTURE_TRACK_MAX,
  MACHI_CAMERA_LABEL_KEYS,
  MACHI_FOCUS_LABEL_KEYS,
  MACHI_VIEW_SLIDERS,
  machiApertureFromTrack,
  machiApertureToTrack,
  signedReadout,
} from "./cameraControls";
import {
  DEFAULT_MACHI_TUNING,
  DEFAULT_MACHI_VIEW,
  MACHI_CAMERA_MODES,
  MACHI_DOF_LIMITS,
  MACHI_FOCUS_MODES,
  MACHI_MOTION_SPEED_LIMITS,
  MACHI_VIEW_LIMITS,
  type MachiCameraMode,
  type MachiCameraView,
  type MachiFocusMode,
  type MachiSceneId,
  type MachiTuning,
} from "./types";

// src/components/visualizer/machi/MachiCameraBar.tsx
// 播放页上町景的取景控制条（像游戏里的拍照模式）：画面上叠取景框的四角、三分线和画面中心（镜头绕着转、对焦“画面中心”
// 对的那一点）；底部一条半透明的横条分三页：视角（默认构图 / 自定义，正在画的这个场景的五个滑块，一动就固定成自定义
// 视角；默认构图下滑块从默认构图读、从默认构图改起）、对焦与光圈（光圈、对焦在哪、手动对焦的前后、清晰范围、景深强度、
// 移轴）、运镜（开关、快慢）。右端是这一页的复位和收起。改的都是 tuning 里的同一套值（和设置面板一样）：滑块拖动时只经
// onPreview 推给画面，松手（指针抬起、键盘改完）再 onCommit 存下，免得每动一格都写存储、整个应用跟着重渲染；
// 选项和开关一点就经 onTuningChange 存。横条放在底部字幕的位置（开着时字幕让开），跟字幕一样让开播放页底部的控制条。
// 横条的控件用设置窗口的那套（kit），颜色固定成深色玻璃上的浅色字，不跟主题的明暗走。

type BarTab = "view" | "lens" | "motion";

const TABS: { id: BarTab; labelKey: TranslationKey }[] = [
  { id: "view", labelKey: "folia.options.machiCameraBarView" },
  { id: "lens", labelKey: "folia.options.machiCameraBarLens" },
  { id: "motion", labelKey: "folia.options.machiCameraBarMotion" },
];

/** 上次停在哪一页：收起再打开还在那一页。 */
let lastTab: BarTab = "view";

interface MachiCameraBarProps {
  tuning: MachiTuning;
  /** 正在画的场景：视角的滑块调它那一份。 */
  scene: MachiSceneId;
  theme: Theme;
  t: (key: TranslationKey) => string;
  /** 播放页底部的控制条藏着没有：横条按它让位。 */
  isPlayerChromeHidden: boolean;
  /** 滑块拖动中：只推给画面，不存。 */
  onPreview: (patch: Partial<MachiTuning>) => void;
  /** 滑块松手：把拖动中的改动存下。 */
  onCommit: () => void;
  /** 选项、开关、复位：立即存下。 */
  onTuningChange: (patch: Partial<MachiTuning>) => void;
  onClose: () => void;
}

// @note Scopify 没有上游设置窗口的控件套件（modal/settings/kit），横条用的几个控件（滑块、分段、开关、页签、按钮）
// 在这里按同样的接口画一遍：深色玻璃上的浅色字，不跟主题的明暗走。

const BAR_FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70";

interface BarSliderProps {
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  disabled?: boolean;
  onChange: (value: number) => void;
}

const Slider: React.FC<BarSliderProps> = ({
  value,
  min,
  max,
  step,
  format,
  disabled,
  onChange,
}) => (
  <span className="flex min-w-0 flex-1 items-center gap-2">
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(Number(event.target.value))}
      className={`h-1 min-w-0 flex-1 cursor-pointer accent-white disabled:cursor-not-allowed ${BAR_FOCUS}`}
    />
    <span className="w-14 shrink-0 text-right font-mono text-[12px] text-white/80">
      {format(value)}
    </span>
  </span>
);

interface BarSegmentedProps<T extends string> {
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
}

const Segmented = <T extends string>({ value, options, onChange }: BarSegmentedProps<T>) => (
  <div role="radiogroup" className="flex flex-wrap gap-1 rounded-full bg-white/10 p-0.5">
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        role="radio"
        aria-checked={option.value === value}
        onClick={() => onChange(option.value)}
        className={`rounded-full px-3 py-1 text-[12px] transition-colors ${BAR_FOCUS} ${
          option.value === value ? "bg-white/90 text-black" : "text-white/75 hover:bg-white/10"
        }`}
      >
        {option.label}
      </button>
    ))}
  </div>
);

const Toggle: React.FC<{
  checked: boolean;
  labelledBy?: string;
  onChange: (checked: boolean) => void;
}> = ({ checked, labelledBy, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-labelledby={labelledBy}
    onClick={() => onChange(!checked)}
    className={`relative h-6 w-10 rounded-full transition-colors ${BAR_FOCUS} ${checked ? "bg-white/90" : "bg-white/20"}`}
  >
    <span
      className={`absolute top-0.5 size-5 rounded-full transition-all ${checked ? "left-[1.1rem] bg-black" : "left-0.5 bg-white"}`}
    />
  </button>
);

interface BarTabsProps {
  tabs: { id: string; label: string }[];
  activeId: string;
  onSelect: (id: string) => void;
  label: string;
  className?: string;
  action?: React.ReactNode;
}

const Tabs: React.FC<BarTabsProps> = ({ tabs, activeId, onSelect, label, className, action }) => (
  <div className={`flex items-center justify-between border-b border-white/10 ${className ?? ""}`}>
    <div role="tablist" aria-label={label} className="flex">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === activeId}
          onClick={() => onSelect(tab.id)}
          className={`relative px-3 py-2.5 text-[13px] transition-colors ${BAR_FOCUS} ${
            tab.id === activeId ? "text-white" : "text-white/60 hover:text-white/85"
          }`}
        >
          {tab.label}
          {tab.id === activeId && (
            <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-white" />
          )}
        </button>
      ))}
    </div>
    {action}
  </div>
);

const Button: React.FC<{
  variant?: "quiet";
  icon?: React.ComponentType<{ size?: number }>;
  tip?: string;
  onClick: () => void;
  children?: React.ReactNode;
}> = ({ icon: Icon, tip, onClick, children }) => (
  <button
    type="button"
    title={tip}
    aria-label={tip}
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12px] text-white/70 transition-colors hover:bg-white/10 hover:text-white ${BAR_FOCUS}`}
  >
    {Icon && <Icon size={14} />}
    {children}
  </button>
);

/** 一格：上面一行是名字和读数，下面是滑块（名字包着整格，滑块读得出自己叫什么）。 */
const BarSlider: React.FC<{ label: string } & React.ComponentProps<typeof Slider>> = ({
  label,
  ...slider
}) => (
  <label className="flex min-w-0 flex-col gap-1">
    <span className={`text-[12px] text-white/60${slider.disabled ? "opacity-40" : ""}`}>
      {label}
    </span>
    <Slider {...slider} />
  </label>
);

/** 一格里放的是一组选择（或开关）：名字在上，控件在下。 */
const BarChoice: React.FC<{ label: string; labelId?: string; children: React.ReactNode }> = ({
  label,
  labelId,
  children,
}) => (
  <div className="flex min-w-0 flex-col gap-1.5">
    <span id={labelId} className="text-[12px] text-white/60">
      {label}
    </span>
    <div className="flex min-h-8 items-center">{children}</div>
  </div>
);

/** 取景框：四角、三分线、画面中心的准星。 */
const Viewfinder: React.FC = () => (
  <div aria-hidden className="pointer-events-none absolute inset-0">
    {[
      ["left-6 top-6", "border-l-2 border-t-2"],
      ["right-6 top-6", "border-r-2 border-t-2"],
      ["bottom-6 left-6", "border-b-2 border-l-2"],
      ["bottom-6 right-6", "border-b-2 border-r-2"],
    ].map(([place, sides]) => (
      <span key={place} className={`absolute size-7 border-white/70 ${place} ${sides}`} />
    ))}
    <span className="absolute inset-y-0 left-1/3 w-px bg-white/15" />
    <span className="absolute inset-y-0 left-2/3 w-px bg-white/15" />
    <span className="absolute inset-x-0 top-1/3 h-px bg-white/15" />
    <span className="absolute inset-x-0 top-2/3 h-px bg-white/15" />
    <span className="absolute top-1/2 left-1/2 size-6 -translate-1/2 rounded-full border border-white/60" />
    <span className="absolute top-1/2 left-1/2 h-px w-3 -translate-1/2 bg-white/80" />
    <span className="absolute top-1/2 left-1/2 h-3 w-px -translate-1/2 bg-white/80" />
  </div>
);

const MachiCameraBar: React.FC<MachiCameraBarProps> = ({
  tuning,
  scene,
  theme,
  t,
  isPlayerChromeHidden,
  onPreview,
  onCommit,
  onTuningChange,
  onClose,
}) => {
  const [tab, setTab] = useState<BarTab>(lastTab);
  const motionLabelId = useId();
  // 底部字幕的位置（VisualizerSubtitleOverlay）：横条放在那里，跟着底部控制条让位。
  const bottom = isPlayerChromeHidden ? 32 : 112;
  // 默认构图下画面就是默认构图：滑块从它读，拖哪一项就从它改起（不是存着的旧自定义视角，不然一拖画面会跳过去）。
  const view = tuning.camera === "custom" ? tuning.views[scene] : DEFAULT_MACHI_VIEW;
  const setView = (next: MachiCameraView) =>
    onPreview({ camera: "custom", views: { ...tuning.views, [scene]: next } });
  // 指针在哪抬起都算松手（拖出滑块外抬起时滑块自己不一定收得到）。
  useEffect(() => {
    window.addEventListener("pointerup", onCommit);
    return () => window.removeEventListener("pointerup", onCommit);
  }, [onCommit]);
  const selectTab = (id: string) => {
    const next = id as BarTab;
    lastTab = next;
    setTab(next);
  };
  const reset = () => {
    if (tab === "view") {
      onTuningChange({
        camera: "default",
        views: { ...tuning.views, [scene]: DEFAULT_MACHI_VIEW },
      });
    } else if (tab === "lens") {
      const { aperture, dof, dofRange, tiltShift, focus, focusOffset } = DEFAULT_MACHI_TUNING;
      onTuningChange({ aperture, dof, dofRange, tiltShift, focus, focusOffset });
    } else {
      onTuningChange({
        motion: DEFAULT_MACHI_TUNING.motion,
        motionSpeed: DEFAULT_MACHI_TUNING.motionSpeed,
      });
    }
  };
  const dofOff = tuning.dof === 0;

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      <Viewfinder />
      <motion.div className="absolute inset-x-0 flex justify-center px-4" style={{ bottom }}>
        <div
          role="region"
          aria-label={t("folia.options.machiCameraBar")}
          className="pointer-events-auto w-full max-w-[920px] rounded-2xl border border-white/10 bg-[rgba(18,18,20,0.74)] text-[13px] text-white shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl"
          // Esc 收起（只在焦点在横条里时：别处的 Esc 还归原来的用处）；空格、回车是横条里按钮和开关的，
          // 不让播放页的全局快捷键拿去暂停。
          onKeyDown={(event) => {
            if (event.key === " " || event.key === "Enter") event.stopPropagation();
            if (event.key !== "Escape") return;
            event.stopPropagation();
            onClose();
          }}
          // 键盘改完一格：存下。
          onKeyUp={onCommit}
        >
          <Tabs
            tabs={TABS.map((item) => ({ id: item.id, label: t(item.labelKey) }))}
            activeId={tab}
            onSelect={selectTab}
            label={t("folia.options.machiCameraBar")}
            className="px-3"
            action={
              <div className="flex items-center gap-1 pr-2">
                <Button variant="quiet" icon={RotateCcw} onClick={reset}>
                  {t("folia.options.machiCameraBarReset")}
                </Button>
                <Button
                  variant="quiet"
                  icon={X}
                  tip={t("folia.options.machiCameraBarClose")}
                  onClick={onClose}
                />
              </div>
            }
          />
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] items-end gap-x-6 gap-y-2 px-5 pt-3 pb-4">
            {tab === "view" && (
              <>
                <BarChoice label={t("folia.options.machiCameraMode")}>
                  <Segmented<MachiCameraMode>
                    value={tuning.camera}
                    options={MACHI_CAMERA_MODES.map((mode) => ({
                      value: mode,
                      label: t(MACHI_CAMERA_LABEL_KEYS[mode]),
                    }))}
                    onChange={(camera) => onTuningChange({ camera })}
                  />
                </BarChoice>
                {MACHI_VIEW_SLIDERS.map((slider) => (
                  <BarSlider
                    key={slider.key}
                    label={t(slider.labelKey)}
                    value={view[slider.key]}
                    min={MACHI_VIEW_LIMITS[slider.key].min}
                    max={MACHI_VIEW_LIMITS[slider.key].max}
                    step={slider.step}
                    format={slider.format}
                    onChange={(value) => setView({ ...view, [slider.key]: value })}
                  />
                ))}
              </>
            )}
            {tab === "lens" && (
              <>
                <BarSlider
                  label={t("folia.options.machiAperture")}
                  value={machiApertureToTrack(tuning.aperture)}
                  min={0}
                  max={MACHI_APERTURE_TRACK_MAX}
                  step={1}
                  format={(index) => apertureReadout(machiApertureFromTrack(index))}
                  disabled={dofOff}
                  onChange={(index) => onPreview({ aperture: machiApertureFromTrack(index) })}
                />
                <BarChoice label={t("folia.options.machiFocus")}>
                  <Segmented<MachiFocusMode>
                    value={tuning.focus}
                    options={MACHI_FOCUS_MODES.map((focus) => ({
                      value: focus,
                      label: t(MACHI_FOCUS_LABEL_KEYS[focus]),
                    }))}
                    onChange={(focus) => onTuningChange({ focus })}
                  />
                </BarChoice>
                <BarSlider
                  label={t("folia.options.machiFocusOffset")}
                  value={tuning.focusOffset}
                  min={MACHI_DOF_LIMITS.focusOffset.min}
                  max={MACHI_DOF_LIMITS.focusOffset.max}
                  step={0.1}
                  format={signedReadout(" m", 1)}
                  disabled={tuning.focus !== "manual"}
                  onChange={(focusOffset) => onPreview({ focusOffset })}
                />
                <BarSlider
                  label={t("folia.options.machiDofRange")}
                  value={tuning.dofRange}
                  min={MACHI_DOF_LIMITS.dofRange.min}
                  max={MACHI_DOF_LIMITS.dofRange.max}
                  step={0.05}
                  format={times}
                  disabled={dofOff}
                  onChange={(dofRange) => onPreview({ dofRange })}
                />
                <BarSlider
                  label={t("folia.options.machiDof")}
                  value={tuning.dof}
                  min={MACHI_DOF_LIMITS.dof.min}
                  max={MACHI_DOF_LIMITS.dof.max}
                  step={0.05}
                  format={percent}
                  onChange={(dof) => onPreview({ dof })}
                />
                <BarSlider
                  label={t("folia.options.machiTiltShift")}
                  value={tuning.tiltShift}
                  min={MACHI_DOF_LIMITS.tiltShift.min}
                  max={MACHI_DOF_LIMITS.tiltShift.max}
                  step={0.05}
                  format={percent}
                  onChange={(tiltShift) => onPreview({ tiltShift })}
                />
              </>
            )}
            {tab === "motion" && (
              <>
                <BarChoice label={t("folia.options.machiCameraMotion")} labelId={motionLabelId}>
                  <Toggle
                    checked={tuning.motion}
                    labelledBy={motionLabelId}
                    onChange={(motion) => onTuningChange({ motion })}
                  />
                </BarChoice>
                <BarSlider
                  label={t("folia.options.machiCameraMotionSpeed")}
                  value={tuning.motionSpeed}
                  min={MACHI_MOTION_SPEED_LIMITS.min}
                  max={MACHI_MOTION_SPEED_LIMITS.max}
                  step={0.05}
                  format={times}
                  disabled={!tuning.motion}
                  onChange={(motionSpeed) => onPreview({ motionSpeed })}
                />
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MachiCameraBar;
