"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ActivityBannerCard } from "@/components/home/ActivityBannerCard";
import { CarouselDotNavigation } from "@/components/home/CarouselDotNavigation";
import { useHomeBanners } from "@/hooks/home/useHomeBanners";
import { useCarouselSwipe } from "@/hooks/home/useCarouselSwipe";
import { useI18n } from "@/store/module/i18n";
import type { CarouselDirection } from "@/types/home";

const AUTO_PLAY_INTERVAL = 6_000;

export function FeaturedActivitiesCarousel() {
  const { data: banners = [], isPending } = useHomeBanners();
  const { t } = useI18n();
  const [activeIndex, setActiveIndex] = useState(0);
  const [trackPosition, setTrackPosition] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState<CarouselDirection>(1);

  const carouselBanners = useMemo(() => {
    if (banners.length < 2) return banners;
    return [...banners.slice(-2), ...banners, ...banners.slice(0, 2)];
  }, [banners]);

  useEffect(() => {
    setActiveIndex(0);
    setTrackPosition(1);
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
      setTrackPosition(loopsToFirst ? banners.length + 1 : loopsToLast ? 0 : nextIndex + 1);
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
    if (trackPosition === 0) {
      setTrackPosition(banners.length);
    } else if (trackPosition === banners.length + 1) {
      setTrackPosition(1);
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
      className="space-y-6"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <h2 className="text-content text-2xl font-bold tracking-tight">
        {t("home.featuredActivities")}
      </h2>

      {hasBanners ? (
        <div
          className="group/activity-carousel relative -mx-2 cursor-grab touch-pan-y overflow-hidden px-2 active:cursor-grabbing"
          onClickCapture={suppressClickAfterSwipe}
          {...swipeHandlers}
        >
          <div
            className={`flex ${isTransitioning && !isDragging ? "transition-transform duration-500 ease-out" : ""}`}
            style={{
              transform: `translateX(calc(-${trackPosition * (100 / 3)}% + ${dragOffset}px))`,
            }}
            onTransitionEnd={(event) => {
              if (event.target === event.currentTarget) handleTransitionEnd();
            }}
          >
            {carouselBanners.map((banner, index) => (
              <div
                key={`${banner.targetId ?? banner.imageUrl ?? banner.pic}-${index}`}
                className="w-1/3 shrink-0 px-2"
              >
                <ActivityBannerCard banner={banner} imageAlt={t("home.banner.imageAlt")} />
              </div>
            ))}
          </div>

          {banners.length > 1 && (
            <>
              <button
                type="button"
                aria-label={t("home.banner.previous")}
                title={t("home.banner.previous")}
                onClick={goToPrevious}
                onPointerDown={(event) => event.stopPropagation()}
                className="border-overlay-foreground/15 bg-overlay/60 text-overlay-foreground hover:bg-overlay focus-visible:outline-brand pointer-events-none absolute top-1/2 left-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border opacity-0 transition-opacity group-hover/activity-carousel:pointer-events-auto group-hover/activity-carousel:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                aria-label={t("home.banner.next")}
                title={t("home.banner.next")}
                onClick={goToNext}
                onPointerDown={(event) => event.stopPropagation()}
                className="border-overlay-foreground/15 bg-overlay/60 text-overlay-foreground hover:bg-overlay focus-visible:outline-brand pointer-events-none absolute top-1/2 right-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border opacity-0 transition-opacity group-hover/activity-carousel:pointer-events-auto group-hover/activity-carousel:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <ChevronRight className="size-4" />
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="bg-skeleton aspect-[16/8] animate-pulse rounded-md"
              aria-hidden="true"
            />
          ))}
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
