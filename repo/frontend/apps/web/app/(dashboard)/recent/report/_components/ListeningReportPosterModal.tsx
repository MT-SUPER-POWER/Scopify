"use client";

import { Download, Loader2, Share2, X } from "lucide-react";
import { Dialog } from "radix-ui";
import { useRef } from "react";

import { LISTENING_REPORT_MONTH_NAMES } from "@/constants/listeningReport";
import { useReceiptImage } from "@/hooks/listeningReport/useReceiptImage";
import { useUserStore } from "@/store";
import type { ListeningReportPosterModalProps } from "@/types/listeningReport/components";
import { ListeningReportReceiptViewer } from "./ListeningReportReceiptViewer";

export function ListeningReportPosterModal({
  isOpen,
  onClose,
  selectedMonth,
  summary,
}: ListeningReportPosterModalProps) {
  const user = useUserStore((state) => state.user);
  const paper = useRef<HTMLDivElement>(null);
  const nickname = user?.nickname ?? "云村村民";
  const monthChineseName = LISTENING_REPORT_MONTH_NAMES[selectedMonth.month - 1] ?? "本月";
  const image = useReceiptImage(
    paper,
    `Scopify-听歌小票-${selectedMonth.year}-${String(selectedMonth.month).padStart(2, "0")}.png`,
  );

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-200 bg-black/75 backdrop-blur-md" />
        <Dialog.Content aria-describedby={undefined} className="fixed inset-0 z-201 outline-none">
          <Dialog.Title className="sr-only">{monthChineseName}听歌小票</Dialog.Title>
          <Dialog.Close
            aria-label="关闭"
            className="fixed top-5 right-5 z-10 grid size-9 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-hidden"
          >
            <X className="size-5" />
          </Dialog.Close>

          <ListeningReportReceiptViewer
            nickname={nickname}
            paperRef={paper}
            selectedMonth={selectedMonth}
            summary={summary}
          >
            <button
              type="button"
              onClick={() => void image.share()}
              disabled={image.isExporting}
              className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-xs font-bold text-white backdrop-blur-md transition-colors hover:bg-white/20 disabled:cursor-wait disabled:opacity-60"
            >
              <Share2 className="size-3.5" />
              <span>分享小票图片</span>
            </button>
            <button
              type="button"
              onClick={() => void image.save()}
              disabled={image.isExporting}
              className="flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-xs font-black text-neutral-900 transition-transform hover:scale-105 active:scale-95 disabled:cursor-wait disabled:opacity-60"
            >
              {image.isExporting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Download className="size-3.5" />
              )}
              <span>{image.isExporting ? "正在生成" : "保存图片"}</span>
            </button>
          </ListeningReportReceiptViewer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
