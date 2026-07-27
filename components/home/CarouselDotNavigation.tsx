"use client";

import { AnimatePresence, motion } from "motion/react";

import { useCarouselSwipe } from "@/hooks/home/useCarouselSwipe";
import type { CarouselDotNavigationProps } from "@/types/components/home";

const DOT_OFFSETS = [-2, -1, 0, 1, 2];
const DOT_STEP = 20;

function getBannerIndex(index: number, offset: number, count: number) {
  return (index + offset + count) % count;
}

export function CarouselDotNavigation({
  activeIndex,
  count,
  direction,
  getSlideLabel,
  label,
  onNext,
  onPrevious,
  onSelect,
}: CarouselDotNavigationProps) {
  const { dragOffset, isDragging, swipeHandlers } = useCarouselSwipe({ onNext, onPrevious });

  return (
    <div
      className="relative h-6 w-25 touch-pan-y"
      aria-label={label}
      role="tablist"
      {...swipeHandlers}
    >
      <AnimatePresence initial={false} mode="sync">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, x: direction * DOT_STEP }}
          animate={{ opacity: 1, x: isDragging ? dragOffset : 0 }}
          exit={{ opacity: 0, x: -direction * DOT_STEP }}
          transition={{ damping: 24, stiffness: 260, type: "spring" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {DOT_OFFSETS.map((offset) => {
            const index = getBannerIndex(activeIndex, offset, count);
            const scale = offset === 0 ? 1 : Math.abs(offset) === 1 ? 0.75 : 0.5;
            const opacity = offset === 0 ? 1 : Math.abs(offset) === 1 ? 0.66 : 0.36;

            return (
              <button
                key={`${index}-${offset}`}
                type="button"
                role="tab"
                aria-current={offset === 0 ? "true" : undefined}
                aria-label={getSlideLabel(index)}
                onClick={() => onSelect(index)}
                className="flex size-5 shrink-0 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span
                  className="size-2 rounded-full bg-white"
                  style={{ opacity, transform: `scale(${scale})` }}
                />
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
