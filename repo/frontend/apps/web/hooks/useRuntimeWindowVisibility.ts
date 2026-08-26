"use client";

import { useEffect, useState } from "react";

import { runtime } from "@/lib/runtime";

export function useRuntimeWindowVisibility() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => runtime.window.onVisibilityChanged(setIsVisible), []);

  return isVisible;
}
