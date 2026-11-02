"use client";

import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";

import type { VipSignModalProps } from "@/types/vipSign/components";
import { VipSignTicket } from "./VipSignTicket";

/** Typefaces of the printed ticket, read by descendants through font-(family-name:--ticket-*). */
const TICKET_FONTS = {
  "--ticket-serif": 'Georgia, "Times New Roman", "Songti SC", "Noto Serif CJK SC", SimSun, serif',
  "--ticket-mono": '"Cascadia Code", "SFMono-Regular", Consolas, monospace',
} as CSSProperties;

export function VipSignModal({ open, onClose, todayRecord }: VipSignModalProps) {
  const { t } = useTranslation();
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-200 bg-black/76 backdrop-blur-[7px]" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 z-201 max-h-[calc(100dvh-88px)] w-[min(960px,calc(100vw-64px))] -translate-1/2 text-[#183b30] outline-none max-[650px]:max-h-[calc(100dvh-24px)] max-[650px]:w-[calc(100vw-32px)] max-[650px]:overflow-x-hidden max-[650px]:overflow-y-auto max-[650px]:pt-[42px] [@media(max-height:650px)]:overflow-x-hidden [@media(max-height:650px)]:overflow-y-auto [@media(max-height:650px)]:pt-[42px]"
          style={TICKET_FONTS}
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">{t("vipSign.ticketTitle")}</Dialog.Title>
          <Dialog.Close
            className="absolute top-[-42px] -right-1 grid size-9 cursor-pointer place-items-center rounded-full text-[#f7f0e2] hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#73977d] max-[650px]:top-0 max-[650px]:right-0 [@media(max-height:650px)]:top-0 [@media(max-height:650px)]:right-0"
            aria-label={t("common.action.close")}
          >
            <X size={22} />
          </Dialog.Close>
          <VipSignTicket
            key={todayRecord?.recordId ?? "today"}
            todayRecord={todayRecord}
            onClose={onClose}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
