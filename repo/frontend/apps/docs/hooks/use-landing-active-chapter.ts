"use client";

import { useEffect, useState } from "react";

import type { LandingChapterId } from "@/types/marketing";

/** 以视口中线为准判断当前所在章节：哪个 `[data-landing-chapter]` 跨过中线，哪个就是当前章节。 */
export function useLandingActiveChapter(initialChapter: LandingChapterId) {
  const [activeChapter, setActiveChapter] = useState(initialChapter);

  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>("[data-landing-chapter]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const chapter = (entry.target as HTMLElement).dataset.landingChapter;
          if (entry.isIntersecting && chapter) setActiveChapter(chapter as LandingChapterId);
        }
      },
      { rootMargin: "-49% 0px -50% 0px" },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return activeChapter;
}
