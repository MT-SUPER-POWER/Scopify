"use client";

import { useSearchParams } from "next/navigation";

/** 当前 MV 页的 id；缺省或非法时为 0。 */
export function useMvId() {
  const mvid = Number(useSearchParams().get("id")) || 0;
  return Number.isSafeInteger(mvid) && mvid > 0 ? mvid : 0;
}
