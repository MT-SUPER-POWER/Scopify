"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Play, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { getTimeTheme } from "@/hooks/home/useHomeData";
import { getSongDetail } from "@/lib/api/track";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { VipSignModalProps } from "@/types/components/vipSign";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function VipSignModal({ open, onClose, todayRecord }: VipSignModalProps) {
  const { t } = useI18n();

  // 从 POST /vip/sign 的 checkinDetail.data 中提取所有展示数据
  const songInfo = todayRecord?.songInfo;
  const songId = songInfo?.songId;
  const songCover = songInfo?.cover ?? "";
  const wishWords = todayRecord?.wishWords;
  const wishUserNickname = todayRecord?.wishUserNickname;
  const consecutiveDays = todayRecord?.monthCheckInTotalDay ?? 0;

  // 获取时间渐变主题
  const theme = useMemo(() => getTimeTheme(), []);

  // 格式化日期：07月 / 04日
  const formattedDate = useMemo(() => {
    const timestamp = todayRecord?.time;
    if (!timestamp) {
      const now = new Date();
      return {
        mm: String(now.getMonth() + 1).padStart(2, "0"),
        dd: String(now.getDate()).padStart(2, "0"),
      };
    }
    const dateObj = new Date(timestamp);
    return {
      mm: String(dateObj.getMonth() + 1).padStart(2, "0"),
      dd: String(dateObj.getDate()).padStart(2, "0"),
    };
  }, [todayRecord]);

  // 播放当前歌曲
  const handlePlay = useCallback(async () => {
    if (!songId) return;
    const store = usePlayerStore.getState();
    const songRes = await getSongDetail(songId);
    const song = songRes?.data?.songs?.[0];
    if (!song) return;
    store.playFromSong(song, [song]);
    onClose();
  }, [songId, onClose]);

  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-200 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Backdrop */}
          <div className="bg-overlay absolute inset-0 backdrop-blur-xs" onClick={onClose} />

          {/* Card Container */}
          <motion.div
            className="bg-surface-raised shadow-floating border-border relative w-full max-w-2xl overflow-hidden rounded-3xl border"
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
          >
            {/* Background Theme Gradient System */}
            <div
              className={cn(
                "pointer-events-none absolute inset-x-0 top-0 z-0 bg-linear-to-b opacity-50",
                theme.gradient,
                "h-full",
              )}
            />

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="text-content-muted hover:bg-accent hover:text-content absolute top-6 right-6 z-20 rounded-full p-2 transition-colors"
            >
              <X className="size-5" />
            </button>

            {/* Content Area */}
            <div className="text-content relative z-10 flex flex-col gap-6 p-8 select-none">
              {/* Header: Date */}
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black">{formattedDate.mm}</span>
                <span className="text-content-muted text-xs font-medium">{t("vipSign.month")}</span>
                <span className="text-content-subtle px-1 font-light">/</span>
                <span className="text-2xl font-black">{formattedDate.dd}</span>
                <span className="text-content-muted text-xs font-medium">{t("vipSign.day")}</span>
              </div>

              {/* Main Body */}
              <div className="flex min-h-40 w-full flex-col items-stretch gap-6 md:flex-row">
                {/* Left: Song details + Wish Words */}
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-content text-2xl font-black tracking-tight">
                        {songInfo?.songName ?? t("vipSign.recommendedSong")}
                      </span>
                      {songInfo?.artistName && (
                        <span className="text-content-muted text-xs font-medium">
                          - {songInfo.artistName}
                        </span>
                      )}
                    </div>
                    {/* Line Divider */}
                    <div className="border-border my-3 w-full border-t" />
                  </div>

                  {/* Wish Words Quote */}
                  <div className="relative flex flex-1 flex-col justify-center py-2 pl-6">
                    <span className="text-content absolute top-0 left-0 font-serif text-5xl leading-none opacity-10 select-none">
                      &quot;
                    </span>
                    {wishWords ? (
                      <div className="flex flex-col gap-1.5">
                        <p className="text-content line-clamp-3 text-sm leading-relaxed font-medium italic">
                          {wishWords}
                        </p>
                        {wishUserNickname && (
                          <span className="text-content-muted self-end text-[10px]">
                            {t("vipSign.commentFrom", { nickname: wishUserNickname })}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-content-muted text-xs italic">
                        {t("vipSign.recommendedSong")}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Album Cover with buttons */}
                <div className="flex shrink-0 items-center justify-center">
                  <div className="bg-surface-elevated shadow-floating group/cover border-border relative size-40 overflow-hidden rounded-2xl border">
                    {songCover ? (
                      <Image
                        width={160}
                        height={160}
                        src={songCover}
                        alt={songInfo?.songName ?? ""}
                        className="size-full object-cover transition-transform duration-500 group-hover/cover:scale-105"
                      />
                    ) : (
                      <div className="text-content-subtle flex size-full items-center justify-center">
                        <X className="size-10" />
                      </div>
                    )}

                    {songId && (
                      <button
                        type="button"
                        onClick={handlePlay}
                        className="bg-brand text-brand-foreground shadow-brand hover:bg-brand-hover absolute right-3 bottom-3 flex size-10 translate-y-3 cursor-pointer items-center justify-center rounded-full opacity-0 transition-all duration-300 group-hover/cover:translate-y-0 group-hover/cover:opacity-100 hover:scale-105"
                        title={t("contextMenu.play")}
                      >
                        <Play className="ml-0.5 size-5 fill-current" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Dotted Divider */}
              <div className="border-border my-2 w-full border-t border-dashed" />

              {/* Footer Section */}
              <div className="flex w-full flex-col items-center justify-between gap-4 sm:flex-row">
                {/* Monthly signed */}
                <div className="text-left">
                  <div className="text-content-muted mb-1 text-[10px] font-semibold tracking-wider uppercase">
                    {t("vipSign.monthlyCheckIn")}
                  </div>
                  <div className="text-content flex items-baseline text-2xl font-black">
                    {consecutiveDays}
                    <span className="text-content-muted ml-0.5 text-xs font-normal">
                      {t("vipSign.days")}
                    </span>
                  </div>
                </div>

                <div className="bg-border hidden h-8 w-px sm:block" />

                {/* QR Code */}
                <div className="bg-surface-elevated border-border flex max-w-60 items-center gap-3 rounded-2xl border p-2.5">
                  <div className="flex flex-col text-left">
                    <span className="text-content-muted text-[10px] font-medium">
                      {t("vipSign.qrGuide")}
                    </span>
                    <span className="text-danger mt-0.5 text-xs font-semibold">
                      {t("vipSign.qrHint")}
                    </span>
                  </div>
                  <div className="bg-qr-surface flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg p-0.5">
                    <Image
                      width={40}
                      height={40}
                      src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://music.163.com/m/header"
                      alt={t("vipSign.qrAlt")}
                      className="size-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return typeof document === "undefined" ? null : createPortal(modal, document.body);
}
