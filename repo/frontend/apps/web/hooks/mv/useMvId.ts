"use client";

import type { MusicResourceRef } from "@scopify/music-domain/identity";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { useActiveProvider } from "@/hooks/provider/useActiveProvider";

/** NetEase MV IDs are numbers and QQ's are short alphanumeric codes. */
const MV_ID_PATTERN = /^[0-9A-Za-z]{1,32}$/;

/** 当前 MV 页的 id；缺省或非法时为空字符串。 */
export function useMvId() {
  const id = useSearchParams().get("id")?.trim() ?? "";
  return MV_ID_PATTERN.test(id) && id !== "0" ? id : "";
}

/** The MV of the page on the active platform, or null when the address names none. */
export function useMvRef(): MusicResourceRef<"mv"> | null {
  const { provider } = useActiveProvider();
  const id = useMvId();
  return useMemo(() => (id ? { provider, kind: "mv", id } : null), [id, provider]);
}
