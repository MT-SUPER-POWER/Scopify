"use client";

import { useEffect, useState } from "react";

export function useDevicePixelRatio() {
  const [ratio, setRatio] = useState(1);
  useEffect(() => {
    let query: MediaQueryList;
    const update = () => {
      query?.removeEventListener("change", update);
      const next = window.devicePixelRatio || 1;
      setRatio(next);
      query = matchMedia(`(resolution: ${next}dppx)`);
      query.addEventListener("change", update);
    };
    update();
    return () => query.removeEventListener("change", update);
  }, []);
  return ratio;
}
