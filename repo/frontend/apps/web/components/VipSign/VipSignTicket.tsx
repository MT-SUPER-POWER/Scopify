"use client";

import { motion } from "framer-motion";
import { MoveVertical } from "lucide-react";
import { useRef } from "react";
import { useTicketInteraction } from "@/hooks/vipSign/useTicketInteraction";
import { useTicketPlayback } from "@/hooks/vipSign/useTicketPlayback";
import { useTranslation } from "react-i18next";

import type { VipSignTicketProps } from "@/types/vipSign/components";
import { TicketPaper } from "./TicketPaper";
import { TicketCurl } from "./TicketCurl";
import { VipSignTicketContent } from "./VipSignTicketContent";
import { VipSignTicketStub } from "./VipSignTicketStub";

export function VipSignTicket({ todayRecord, onClose }: VipSignTicketProps) {
  const { t } = useTranslation();
  const interaction = useTicketInteraction(onClose);
  const { play, isPlaying } = useTicketPlayback(todayRecord?.songInfo?.songId, onClose);
  const { reducedMotion, isTorn } = interaction;
  const stub = useRef<HTMLDivElement>(null);
  return (
    <div
      className="perspective-[1400px] motion-reduce:perspective-none"
      onPointerMove={interaction.tilt}
      onPointerLeave={interaction.resetTilt}
    >
      <motion.div
        // A filter here would flatten the descendant paper strips into a single plane.
        className="grid min-h-110 grid-cols-[minmax(0,1fr)_26%] transform-3d max-[650px]:min-h-100 max-[650px]:grid-cols-[minmax(0,1fr)_34%]"
        style={{ rotateX: interaction.rotateX, rotateY: interaction.rotateY }}
      >
        <motion.article
          className="relative isolate bg-[#f7efdf] ticket-notch perforated-edge-r after:pointer-events-none after:absolute after:inset-[9px] after:z-2 after:rounded-lg after:border after:border-r-0 after:border-[#28463755]"
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
            className="absolute inset-y-4 right-0 w-px text-[#284637aa] [--dash-gap:5px] [--dash-size:4px] dash-rule-y"
            style={{ scaleY: interaction.seam, originY: interaction.seamOrigin }}
          />
        </motion.article>
        <motion.aside
          className="relative min-w-0 origin-bottom-left transform-3d"
          animate={isTorn ? { y: reducedMotion ? 0 : 150, opacity: 0 } : undefined}
          transition={{ duration: reducedMotion ? 0 : 0.65, ease: [0.3, 0, 0.7, 1] }}
          onAnimationComplete={interaction.finish}
        >
          <motion.div
            className="relative h-full min-w-0 origin-bottom-left cursor-grab touch-none select-none transform-3d active:cursor-grabbing"
            onPointerDown={interaction.start}
            onPointerMove={interaction.move}
            onPointerUp={(event) => interaction.release(event)}
            onPointerCancel={(event) => interaction.release(event, true)}
            onLostPointerCapture={(event) => interaction.release(event, true)}
          >
            <div
              ref={stub}
              className="relative isolate flex h-full flex-col bg-[#f7efdf] ticket-notch perforated-edge-l before:pointer-events-none before:absolute before:inset-0 before:z-0 before:bg-[linear-gradient(100deg,#183b3012,transparent_20%,#fff4_80%,transparent)] after:pointer-events-none after:absolute after:inset-[9px] after:z-2 after:rounded-lg after:border after:border-l-0 after:border-[#28463755]"
            >
              <TicketPaper />
              <VipSignTicketStub todayRecord={todayRecord} onPlay={play} isPlaying={isPlaying} />
              <button
                type="button"
                data-ticket-tear
                className="relative z-3 mx-[18px] mt-auto mb-3 flex min-h-11 cursor-grab touch-none items-center justify-center gap-1 pt-[9px] text-[10px] text-[#435a47] select-none hover:text-[#102f22] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#73977d] active:cursor-grabbing max-[650px]:mx-3 [&_svg]:shrink-0"
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
