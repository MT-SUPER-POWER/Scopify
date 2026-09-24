"use client";

import { useCallback, useEffect, useState } from "react";

export function useLatticeExpansionSettled(expanded: boolean, reducedMotion: boolean | null) {
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (!expanded || reducedMotion) setSettled(expanded);
  }, [expanded, reducedMotion]);
  const onComplete = useCallback(() => {
    if (expanded) setSettled(true);
  }, [expanded]);
  return [settled && expanded, onComplete] as const;
}
