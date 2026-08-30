"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ActivityBannerCard } from "@/components/home/ActivityBannerCard";
import { CarouselDotNavigation } from "@/components/home/CarouselDotNavigation";
import { useHomeBanners } from "@/hooks/home/useHomeBanners";
import { useCarouselSwipe } from "@/hooks/home/useCarouselSwipe";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { CarouselDirection } from "@/types/home";

const AUTO_PLAY_INTERVAL = 6_000;

export function FeaturedActivitiesCarousel() {
  const { data: banners = [], isPending } = useHomeBanners();
  const { t } = useI18n();
  const [activeIndex, setActiveIndex] = useState(0);
  const [trackPosition, setTrackPosition] = useState(2);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState<CarouselDirection>(1);

  const carouselBanners = useMemo(() => {
    if (banners.length < 2) return banners;
    return [...banners.slice(-2), ...banners, ...banners.slice(0, 2)];
  }, [banners]);

  useEffect(() => {
    setActiveIndex(0);
    setTrackPosition(2);
    setIsTransitioning(false);
  }, [banners.length]);

  const goToNext = useCallback(() => {
    if (isTransitioning || banners.length < 2) return;

    setDirection(1);
    setActiveIndex((index) => (index + 1) % banners.length);
    setTrackPosition((position) => position + 1);
    setIsTransitioning(true);
  }, [banners.length, isTransitioning]);

  const goToPrevious = useCallback(() => {
    if (isTransitioning || banners.length < 2) return;

    setDirection(-1);
    setActiveIndex((index) => (index - 1 + banners.length) % banners.length);
    setTrackPosition((position) => position - 1);
    setIsTransitioning(true);
  }, [banners.length, isTransitioning]);

  const goToBanner = useCallback(
    (nextIndex: number) => {
      if (isTransitioning || nextIndex === activeIndex || banners.length < 2) return;

      const loopsToFirst = activeIndex === banners.length - 1 && nextIndex === 0;
      const loopsToLast = activeIndex === 0 && nextIndex === banners.length - 1;
      const forwardDistance = (nextIndex - activeIndex + banners.length) % banners.length;
      const backwardDistance = (activeIndex - nextIndex + banners.length) % banners.length;

      setDirection(forwardDistance <= backwardDistance ? 1 : -1);
      setActiveIndex(nextIndex);
      setTrackPosition(loopsToFirst ? banners.length + 2 : loopsToLast ? 1 : nextIndex + 2);
      setIsTransitioning(true);
    },
    [activeIndex, banners.length, isTransitioning],
  );

  useEffect(() => {
    if (isPaused || banners.length < 2) return;

    const timer = window.setInterval(goToNext, AUTO_PLAY_INTERVAL);
    return () => window.clearInterval(timer);
  }, [banners.length, goToNext, isPaused]);

  const handleTransitionEnd = () => {
    if (!isTransitioning) return;

    setIsTransitioning(false);
    if (trackPosition <= 1) {
      setTrackPosition(banners.length + 1);
    } else if (trackPosition >= banners.length + 2) {
      setTrackPosition(2);
    }
  };

  const { dragOffset, isDragging, suppressClickAfterSwipe, swipeHandlers } = useCarouselSwipe({
    onNext: goToNext,
    onPrevious: goToPrevious,
  });

  if (!isPending && banners.length === 0) return null;

  const hasBanners = banners.length > 0;

  return (
    <section
      aria-busy={isPending}
      aria-label={t("home.banner.label")}
      className="space-y-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <h2 className="text-2xl font-bold tracking-tight text-content">
        {t("home.featuredActivities")}
      </h2>

      {hasBanners ? (
        banners.length === 1 ? (
          <div className="mx-auto max-w-4xl px-2 py-4">
            <ActivityBannerCard banner={banners[0]} imageAlt={t("home.banner.imageAlt")} isCenter />
          </div>
        ) : (
          <div
            className="group/activity-carousel relative -mx-2 cursor-grab touch-pan-y overflow-hidden p-2 select-none [--banner-width:82%] active:cursor-grabbing sm:[--banner-width:68%] md:[--banner-width:56%] lg:[--banner-width:52%]"
            onClickCapture={suppressClickAfterSwipe}
            {...swipeHandlers}
          >
            <div
              className={`flex items-center py-6 ${isTransitioning && !isDragging ? "transition-transform duration-500 ease-out" : ""}`}
              style={{
                transform: `translateX(calc((100% - var(--banner-width)) / 2 - ${trackPosition} * var(--banner-width) + ${dragOffset}px))`,
              }}
              onTransitionEnd={(event) => {
                if (event.target === event.currentTarget) handleTransitionEnd();
              }}
            >
              {carouselBanners.map((banner, index) => {
                const isCenter = index === trackPosition;
                const isLeft = index === trackPosition - 1;
                const isRight = index === trackPosition + 1;

                let cardStyle = "scale-[0.84] opacity-40 brightness-65 z-0";
                if (isCenter) {
                  cardStyle =
                    "scale-100 sm:scale-[1.03] lg:scale-[1.05] opacity-100 brightness-100 z-10 shadow-2xl ring-1 ring-white/10";
                } else if (isLeft || isRight) {
                  cardStyle =
                    "scale-[0.88] opacity-60 brightness-75 hover:opacity-85 hover:brightness-90 z-0";
                } else {
                  cardStyle = "scale-[0.78] opacity-15 brightness-50 z-0 pointer-events-none";
                }

                return (
                  <div
                    key={`${banner.targetId ?? banner.imageUrl ?? banner.pic}-${index}`}
                    style={{ width: "var(--banner-width)" }}
                    className="shrink-0 px-2 sm:px-3"
                  >
                    <div
                      className={cn(
                        "origin-center transition-all duration-500 ease-out",
                        cardStyle,
                      )}
                    >
                      <ActivityBannerCard
                        banner={banner}
                        imageAlt={t("home.banner.imageAlt")}
                        isCenter={isCenter}
                        onClickSide={isLeft ? goToPrevious : isRight ? goToNext : undefined}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              aria-label={t("home.banner.previous")}
              title={t("home.banner.previous")}
              onClick={goToPrevious}
              onPointerDown={(event) => event.stopPropagation()}
              className="pointer-events-none absolute top-1/2 left-3 z-20 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white opacity-0 backdrop-blur-md transition-all group-hover/activity-carousel:pointer-events-auto group-hover/activity-carousel:opacity-100 hover:scale-110 hover:bg-black/85 focus-visible:pointer-events-auto focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label={t("home.banner.next")}
              title={t("home.banner.next")}
              onClick={goToNext}
              onPointerDown={(event) => event.stopPropagation()}
              className="pointer-events-none absolute top-1/2 right-3 z-20 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white opacity-0 backdrop-blur-md transition-all group-hover/activity-carousel:pointer-events-auto group-hover/activity-carousel:opacity-100 hover:scale-110 hover:bg-black/85 focus-visible:pointer-events-auto focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        )
      ) : (
        <div className="flex items-center justify-center gap-4 overflow-hidden py-6">
          <div
            className="scale-0.85 aspect-[2.4/1] w-[20%] shrink-0 animate-pulse rounded-xl bg-skeleton opacity-50"
            aria-hidden="true"
          />
          <div
            className="sm:scale-1.04 aspect-[2.4/1] w-[52%] shrink-0 scale-100 animate-pulse rounded-xl bg-skeleton opacity-100 shadow-xl"
            aria-hidden="true"
          />
          <div
            className="scale-0.85 aspect-[2.4/1] w-[20%] shrink-0 animate-pulse rounded-xl bg-skeleton opacity-50"
            aria-hidden="true"
          />
        </div>
      )}

      {banners.length > 1 && (
        <div className="flex justify-center">
          <CarouselDotNavigation
            activeIndex={activeIndex}
            count={banners.length}
            direction={direction}
            getSlideLabel={(index) => t("home.banner.goToSlide", { number: index + 1 })}
            label={t("home.banner.navigation")}
            onNext={goToNext}
            onPrevious={goToPrevious}
            onSelect={goToBanner}
          />
        </div>
      )}

      <span className="sr-only">{isPending ? t("home.banner.loading") : ""}</span>
    </section>
  );
}
