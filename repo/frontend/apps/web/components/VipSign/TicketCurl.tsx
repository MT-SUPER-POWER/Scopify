"use client";

import { useTicketCurl } from "@/hooks/vipSign/useTicketCurl";
import type { TicketCurlProps } from "@/types/vipSign/components";
import styles from "./VipSignTicket.module.css";

export function TicketCurl(props: TicketCurlProps) {
  const layer = useTicketCurl(props);
  return <div ref={layer} className={styles.curlLayer} aria-hidden="true" inert />;
}
