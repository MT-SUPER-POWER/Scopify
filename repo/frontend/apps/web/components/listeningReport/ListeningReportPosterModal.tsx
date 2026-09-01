"use client";

import { Check, Share2, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LISTENING_REPORT_MONTH_NAMES } from "@/constants/listeningReport";
import { formatMinutesText } from "@/lib/listeningReport/dateHelpers";
import { useUserStore } from "@/store";
import type { ListeningReportPosterModalProps } from "@/types/components/listeningReport";

export function ListeningReportPosterModal({
  isOpen,
  onClose,
  selectedMonth,
  summary,
}: ListeningReportPosterModalProps) {
  const user = useUserStore((state) => state.user);
  const [copied, setCopied] = useState(false);

  const monthChineseName = useMemo(() => {
    return LISTENING_REPORT_MONTH_NAMES[selectedMonth.month - 1] ?? "本月";
  }, [selectedMonth.month]);

  const durationDisplay = useMemo(() => {
    if (summary.playDurationMinutes && summary.playDurationMinutes > 0) {
      return formatMinutesText(summary.playDurationMinutes);
    }
    return summary.durationText ?? "—";
  }, [summary.playDurationMinutes, summary.durationText]);

  const handleShare = async () => {
    const shareText = `${user?.nickname ?? "我"}在 Scopify 的${monthChineseName}听歌足迹：${durationDisplay}，${summary.activeDays ?? 0} 天有音乐在场。`;

    try {
      if (navigator.share) {
        await navigator.share({ text: shareText, title: `${monthChineseName}听歌足迹` });
        toast.success("已打开系统分享");
      } else {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        toast.success("分享文案已复制");
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("暂时无法分享，请稍后再试");
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <AlertDialogContent className="max-w-md overflow-hidden rounded-3xl border border-border/80 bg-surface-overlay p-0 text-content shadow-2xl backdrop-blur-xl">
        <AlertDialogHeader className="sr-only">
          <AlertDialogTitle>{monthChineseName}听歌海报</AlertDialogTitle>
        </AlertDialogHeader>

        {/* Poster Printable Card Area */}
        <div className="relative flex flex-col overflow-hidden bg-linear-to-b from-surface-raised via-surface-overlay to-background p-6">
          {/* User Header Row */}
          <div className="relative z-10 flex items-center justify-between border-b border-border/70 pb-4">
            <div className="flex items-center gap-3">
              {user?.avatarUrl ? (
                <img
                  alt=""
                  src={user.avatarUrl}
                  className="size-10 rounded-full border border-border object-cover"
                />
              ) : (
                <div className="flex size-10 items-center justify-center rounded-full bg-brand font-black text-brand-foreground">
                  {user?.nickname?.[0] ?? "S"}
                </div>
              )}
              <div>
                <p className="text-sm font-black text-content">{user?.nickname ?? "云村村民"}</p>
                <p className="text-[11px] font-semibold text-content-muted">
                  {selectedMonth.year}年{monthChineseName} · 听歌打卡足迹
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1 rounded-full border border-brand/40 bg-brand/15 px-2.5 py-1 text-[10px] font-black text-brand">
              <Trophy className="size-3" />
              <span>{summary.title || "听歌全勤奖"}</span>
            </div>
          </div>

          {/* Big Monthly Duration Banner */}
          <div className="relative z-10 mt-6 text-center">
            <p className="text-xs font-bold tracking-wider text-content-muted uppercase">
              {monthChineseName}累计收听
            </p>
            <h2 className="mt-1 text-3xl font-black tracking-tight text-content sm:text-4xl">
              {durationDisplay}
            </h2>
            <p className="mt-1 text-xs font-semibold text-brand">
              {summary.durationText || `已陪伴你 ${summary.activeDays ?? 30} 天`}
            </p>
          </div>

          {/* Mini Album Cover Grid Collage */}
          {summary.wallpaperUrls.length > 0 && (
            <div className="relative z-10 mt-6 overflow-hidden rounded-2xl border border-border/70 bg-surface-raised/60 p-2 shadow-inner">
              <div className="grid grid-cols-4 gap-1.5">
                {summary.wallpaperUrls.slice(0, 8).map((url, i) => (
                  <div
                    key={i}
                    className="aspect-square overflow-hidden rounded-lg bg-surface-elevated"
                  >
                    <img alt="" src={url} className="size-full object-cover" />
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between px-1 text-[11px] font-bold text-content-muted">
                <span>{monthChineseName}唱片集锦</span>
                <span className="text-content">{summary.songCount ?? 0} 首曲目</span>
              </div>
            </div>
          )}

          {/* Highlights Summary Pills */}
          <div className="relative z-10 mt-5 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-xl border border-border/70 bg-surface-raised/70 p-2.5">
              <p className="text-[10px] font-bold text-content-muted">活跃天数</p>
              <p className="mt-0.5 text-sm font-black text-content">{summary.activeDays ?? 0} 天</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-surface-raised/70 p-2.5">
              <p className="text-[10px] font-bold text-content-muted">偏爱曲风</p>
              <p className="mt-0.5 truncate text-sm font-black text-brand">
                {summary.topStyle?.genreName || "流行"}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-surface-raised/70 p-2.5">
              <p className="text-[10px] font-bold text-content-muted">高频单曲</p>
              <p className="mt-0.5 truncate text-sm font-black text-amber-400">
                {summary.topSong?.title || "Not to Me"}
              </p>
            </div>
          </div>

          {/* Footer Watermark */}
          <div className="relative z-10 mt-6 flex items-center justify-between border-t border-border/70 pt-4 text-[10px] font-bold text-content-muted">
            <span>Scopify 音乐客户端</span>
            <span>https://scopify.app</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 border-t border-border/70 bg-surface-raised/90 p-4">
          <button
            type="button"
            onClick={() => void handleShare()}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-elevated px-4 py-2 text-xs font-bold text-content transition-colors hover:bg-surface-raised"
          >
            {copied ? <Check className="size-3.5 text-brand" /> : <Share2 className="size-3.5" />}
            <span>{copied ? "已复制" : "分享这份足迹"}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-black text-brand-foreground shadow-brand/20 shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            <Check className="size-3.5" />
            <span>完成</span>
          </button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
