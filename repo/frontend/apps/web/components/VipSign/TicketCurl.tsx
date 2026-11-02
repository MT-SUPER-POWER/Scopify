"use client";

import { useTicketCurl } from "@/hooks/vipSign/useTicketCurl";
import type { TicketCurlProps } from "@/types/vipSign/components";

export function TicketCurl(props: TicketCurlProps) {
  const layer = useTicketCurl(props);
  return (
    <div
      ref={layer}
      className="pointer-events-none invisible absolute inset-0 transform-3d"
      aria-hidden="true"
      inert
    />
  );
}
