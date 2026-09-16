"use client";

import { motion } from "framer-motion";
import { MoveVertical } from "lucide-react";
import { useRef } from "react";
import { useTicketInteraction } from "@/hooks/vipSign/useTicketInteraction";
import { useTicketPlayback } from "@/hooks/vipSign/useTicketPlayback";
import { useI18n } from "@/store/module/i18n";
import type { VipSignTicketProps } from "@/types/components/vipSign";
import { TicketPaper } from "./TicketPaper";
import { TicketCurl } from "./TicketCurl";
import { VipSignTicketContent } from "./VipSignTicketContent";
import { VipSignTicketStub } from "./VipSignTicketStub";
import styles from "./VipSignTicket.module.css";

export function VipSignTicket({ todayRecord, onClose }: VipSignTicketProps) {
  const { t } = useI18n();
  const interaction = useTicketInteraction(onClose);
  const { play, isPlaying } = useTicketPlayback(todayRecord?.songInfo?.songId, onClose);
  const { reducedMotion, isTorn } = interaction;
  const stub = useRef<HTMLDivElement>(null);
  return (
    <div
      className={styles.stage}
      onPointerMove={interaction.tilt}
      onPointerLeave={interaction.resetTilt}
    >
      <motion.div
        className={styles.ticket}
        style={{ rotateX: interaction.rotateX, rotateY: interaction.rotateY }}
      >
        <motion.article
          className={styles.main}
          animate={{ opacity: isTorn ? 0 : 1, y: isTorn && !reducedMotion ? -18 : 0 }}
          transition={{
            duration: reducedMotion ? 0 : 0.3,
            delay: isTorn && !reducedMotion ? 0.35 : 0,
          }}
        >
          <TicketPaper />
          <VipSignTicketContent todayRecord={todayRecord} />
          <motion.div
            aria-hidden="true"
            className={styles.seam}
            style={{ scaleY: interaction.seam, originY: interaction.seamOrigin }}
          />
        </motion.article>
        <motion.aside
          className={styles.stubExit}
          animate={isTorn ? { y: reducedMotion ? 0 : 150, opacity: 0 } : undefined}
          transition={{ duration: reducedMotion ? 0 : 0.65, ease: [0.3, 0, 0.7, 1] }}
          onAnimationComplete={interaction.finish}
        >
          <motion.div
            className={styles.stubMotion}
            onPointerDown={interaction.start}
            onPointerMove={interaction.move}
            onPointerUp={(event) => interaction.release(event)}
            onPointerCancel={(event) => interaction.release(event, true)}
            onLostPointerCapture={(event) => interaction.release(event, true)}
          >
            <div ref={stub} className={styles.stub}>
              <TicketPaper />
              <VipSignTicketStub todayRecord={todayRecord} onPlay={play} isPlaying={isPlaying} />
              <button
                type="button"
                data-ticket-tear
                className={styles.tearHandle}
                disabled={isTorn}
                onClick={(event) => {
                  if (event.detail === 0) interaction.tear();
                }}
                aria-label={t("vipSign.tearAction")}
              >
                <span>{t("vipSign.tearHint")}</span>
                <MoveVertical size={16} />
              </button>
            </div>
            {!reducedMotion && (
              <TicketCurl
                source={stub}
                progress={interaction.pull}
                direction={interaction.direction}
              />
            )}
          </motion.div>
        </motion.aside>
      </motion.div>
    </div>
  );
}
