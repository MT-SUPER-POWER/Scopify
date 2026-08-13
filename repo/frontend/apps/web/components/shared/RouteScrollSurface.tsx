"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { useNavigationScroll } from "@/components/shared/NavigationScrollProvider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { RouteRestorationPlaceholder } from "@/types/navigation-scroll";

interface RouteScrollSurfaceProps {
  children: ReactNode;
}

/**
 * The only scroll owner for dashboard route content. `template.tsx` remounts
 * this surface for every route transition so history restoration never shares
 * a DOM viewport between two pages.
 */
export function RouteScrollSurface({ children }: RouteScrollSurfaceProps) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const { isRestoring, registerSurface, restorationPlaceholder } = useNavigationScroll();

  useEffect(() => {
    const surface = surfaceRef.current;
    if (surface) surface.tabIndex = 0;

    registerSurface(surface);

    return () => {
      registerSurface(null);
    };
  }, [registerSurface]);

  return (
    <div className="relative size-full">
      <ScrollArea
        aria-busy={isRestoring}
        className={cn(
          "bg-surface-raised isolate z-0 size-full",
          "[&_[data-slot=scroll-area-viewport]>div]:block!",
          "[&_[data-slot=scroll-area-viewport]>div]:min-h-full!",
          "[&_[data-slot=scroll-area-viewport]>div]:w-full!",
          isRestoring && "pointer-events-none",
        )}
        viewportRef={surfaceRef}
      >
        <div className={cn("min-h-full", isRestoring && "invisible")}>{children}</div>
      </ScrollArea>
      {isRestoring ? <RouteScrollSkeleton Placeholder={restorationPlaceholder} /> : null}
    </div>
  );
}

function RouteScrollSkeleton({ Placeholder }: { Placeholder: null | RouteRestorationPlaceholder }) {
  if (Placeholder) {
    return (
      <div aria-hidden="true" className="bg-surface-raised absolute inset-0 z-10 overflow-hidden">
        <Placeholder />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className="bg-surface-raised absolute inset-0 z-10 animate-pulse px-6 pt-24"
    >
      <div className="bg-skeleton-subtle h-8 w-48 rounded" />
      <div className="bg-skeleton-subtle mt-4 h-4 w-80 max-w-full rounded" />
      <div className="mt-10 space-y-3">
        {["one", "two", "three", "four", "five", "six"].map((key) => (
          <div key={key} className="bg-skeleton-subtle h-14 rounded" />
        ))}
      </div>
    </div>
  );
}
