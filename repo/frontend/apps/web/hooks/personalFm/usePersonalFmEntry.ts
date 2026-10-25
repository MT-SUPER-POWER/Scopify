"use client";

import { useEffect, useRef, type MouseEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PERSONAL_FM_ROUTE, isPersonalFmRoute } from "@/constants/personalFm";
import { ensurePersonalFmOnEntry } from "@/lib/personalFm/entry";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";

export function usePersonalFmEntry() {
  const router = useRouter();
  const pathname = usePathname();
  const isLoggedIn = useLoginStatus();
  const pending = useRef(false);
  const entryRevision = useRef(0);

  useEffect(
    () => () => {
      entryRevision.current++;
    },
    [pathname],
  );

  return async (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    if (!isLoggedIn || isPersonalFmRoute(pathname)) return;
    event.preventDefault();
    if (pending.current) return;
    pending.current = true;
    const revision = entryRevision.current;
    const isCurrent = () => revision === entryRevision.current;
    try {
      if (await ensurePersonalFmOnEntry(isCurrent)) {
        if (isCurrent()) router.push(PERSONAL_FM_ROUTE);
      }
    } finally {
      pending.current = false;
    }
  };
}
