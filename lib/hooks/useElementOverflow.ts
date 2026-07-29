"use client";

import { useLayoutEffect, useRef, useState } from "react";

export function useElementOverflow<T extends HTMLElement>(content: string) {
  const elementRef = useRef<T>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const updateOverflow = () => {
      setIsOverflowing(
        element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight,
      );
    };

    updateOverflow();

    const observer = new ResizeObserver(updateOverflow);
    observer.observe(element);

    return () => observer.disconnect();
  }, [content]);

  return { elementRef, isOverflowing };
}
