import { cn } from "@/lib/utils";
// Adapted from chthollyphile/folia-major v0.8.0 (3b91924f1), AGPL-3.0.
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Coffee,
  Moon,
  MoonStar,
  Sun,
  Sunrise,
  Sunset,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import {
  historyGreetingSlot,
  msUntilNextGreetingSlot,
  type HistoryGreetingSlot,
} from "@/lib/scratchpad/historyGreeting";

// src/components/app/scratchpad/ScratchpadGreeting.tsx

// 展开整页写在右上角的黑三角里，用长版（窄屏的三角小，换短版，见 ScratchpadSheet）。不带 headline 时是一行带时段图标的眉批。

/** 每一段前面的小图标。 */
const SLOT_ICONS: Record<HistoryGreetingSlot, LucideIcon> = {
  lateNight: MoonStar,
  dawn: Sunrise,
  morning: Sun,
  noon: Utensils,
  afternoon: Coffee,
  evening: Sunset,
  night: Moon,
};

const ScratchpadGreeting: React.FC<{ long: boolean; headline?: boolean; className?: string }> = ({
  long,
  headline = false,
  className,
}) => {
  const { t } = useTranslation();
  const [slot, setSlot] = useState(() => historyGreetingSlot(new Date()));
  // 每次到点都重挂下一个（tick 每次都变）：时钟被往回调过、算出来还是同一段时也不会停下。
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSlot(historyGreetingSlot(new Date()));
      setTick((current) => current + 1);
    }, msUntilNextGreetingSlot(new Date()));
    return () => window.clearTimeout(timer);
  }, [tick]);
  const text = long ? t(`scratchpad.greeting.${slot}`) : t(`scratchpad.greetingShort.${slot}`);
  const Icon = SLOT_ICONS[slot];
  return (
    <p
      className={cn("scratchpad-greeting", headline && "is-headline", className)}

      data-testid="scratchpad-greeting"
    >
      {!headline && <Icon aria-hidden="true" />}
      <span>{text}</span>
    </p>
  );
};

export default ScratchpadGreeting;
