"use client";

import { useEffect, useRef, useState } from "react";

import type { LandingScene } from "@/types/marketing";

export function useLandingScene() {
  const introRef = useRef<HTMLElement | null>(null);
  const performanceRef = useRef<HTMLElement | null>(null);
  const fragmentsRef = useRef<HTMLElement | null>(null);
  const interfaceRef = useRef<HTMLElement | null>(null);
  const epilogueRef = useRef<HTMLElement | null>(null);
  const [scene, setScene] = useState<LandingScene>("intro");

  useEffect(() => {
    const elements = [
      introRef.current,
      performanceRef.current,
      fragmentsRef.current,
      interfaceRef.current,
      epilogueRef.current,
    ];
    if (elements.some((element) => !element)) return;

    const ratios = new Map<Element, number>();
    const scenes: LandingScene[] = ["intro", "performance", "fragments", "interface", "epilogue"];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) ratios.set(entry.target, entry.intersectionRatio);
        const nextIndex = elements.reduce((bestIndex, element, index) => {
          const bestRatio = ratios.get(elements[bestIndex]!) ?? 0;
          return (ratios.get(element!) ?? 0) > bestRatio ? index : bestIndex;
        }, 0);
        setScene(scenes[nextIndex]);
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    for (const element of elements) observer.observe(element!);
    return () => observer.disconnect();
  }, []);

  return { introRef, performanceRef, fragmentsRef, interfaceRef, epilogueRef, scene };
}
