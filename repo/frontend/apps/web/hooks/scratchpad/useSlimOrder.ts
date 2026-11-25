// Adapted from chthollyphile/folia-major v0.8.0 (3b91924f1), AGPL-3.0.
import { useRef } from "react";
import type { ScratchpadSection as ScratchpadTab } from "@/types/scratchpad/components";
export const useSlimOrder = (
  tabs: readonly ScratchpadTab[],
  tab: ScratchpadTab,
): ScratchpadTab[] => {
  const orderRef = useRef<ScratchpadTab[]>([]);
  const slim = tabs.filter((id) => id !== tab);
  const kept = orderRef.current.filter((id) => slim.includes(id));
  const next = [...kept, ...slim.filter((id) => !kept.includes(id))];
  if (
    next.length !== orderRef.current.length ||
    next.some((id, index) => id !== orderRef.current[index])
  )
    orderRef.current = next;
  return orderRef.current;
};
