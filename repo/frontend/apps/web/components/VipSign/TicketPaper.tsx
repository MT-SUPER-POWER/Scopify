"use client";

import dynamic from "next/dynamic";
import { memo } from "react";
import styles from "./VipSignTicket.module.css";

const PaperTexture = dynamic(
  () => import("@paper-design/shaders-react").then((module) => module.PaperTexture),
  { ssr: false },
);

const TICKET_PAPER_FRONT_COLOR = "\x23fcf5e6";
const TICKET_PAPER_BACK_COLOR = "\x23eee2c9";

/** Generated cotton-paper scan remains visible while the static shader loads. */
export const TicketPaper = memo(function TicketPaper() {
  return (
    <div aria-hidden="true" className={styles.paper}>
      <PaperTexture
        width="100%"
        height="100%"
        image="/images/vip-sign/concert-paper.png"
        colorFront={TICKET_PAPER_FRONT_COLOR}
        colorBack={TICKET_PAPER_BACK_COLOR}
        fit="cover"
        roughness={0.12}
        fiber={0.16}
        fiberSize={0.3}
        contrast={0.15}
        crumples={0.08}
        crumpleSize={0.3}
        folds={0}
        drops={0.02}
        seed={16}
        speed={0}
        maxPixelCount={700000}
      />
    </div>
  );
});
