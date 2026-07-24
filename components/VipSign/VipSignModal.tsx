"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Play, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useMemo } from "react";
import { getTimeTheme } from "@/hooks/home/useHomeData";
import { getSongDetail } from "@/lib/api/track";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { VipSignDetail } from "@/types/api/vipSign";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Props
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface VipSignModalProps {
  open: boolean;
  onClose: () => void;
  /** POST /vip/sign 返回的 checkinDetail.data，包含所有展示数据 */
  todayRecord: VipSignDetail | undefined;
}

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

  return (
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
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs" onClick={onClose} />

          {/* Card Container */}
          <motion.div
            className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#121212] shadow-2xl"
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
              className="absolute top-6 right-6 z-20 rounded-full p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="size-5" />
            </button>

            {/* Content Area */}
            <div className="relative z-10 flex flex-col gap-6 p-8 text-white select-none">
              {/* Header: Date */}
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black">{formattedDate.mm}</span>
                <span className="text-xs font-medium text-zinc-500">{t("vipSign.month")}</span>
                <span className="px-1 font-light text-zinc-600">/</span>
                <span className="text-2xl font-black">{formattedDate.dd}</span>
                <span className="text-xs font-medium text-zinc-500">{t("vipSign.day")}</span>
              </div>

              {/* Main Body */}
              <div className="flex min-h-40 w-full flex-col items-stretch gap-6 md:flex-row">
                {/* Left: Song details + Wish Words */}
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-2xl font-black tracking-tight text-white">
                        {songInfo?.songName ?? t("vipSign.recommendedSong")}
                      </span>
                      {songInfo?.artistName && (
                        <span className="text-xs font-medium text-zinc-400">
                          - {songInfo.artistName}
                        </span>
                      )}
                    </div>
                    {/* Line Divider */}
                    <div className="my-3 w-full border-t border-white/10" />
                  </div>

                  {/* Wish Words Quote */}
                  <div className="relative flex flex-1 flex-col justify-center py-2 pl-6">
                    <span className="absolute top-0 left-0 font-serif text-5xl leading-none text-white/10 select-none">
                      &quot;
                    </span>
                    {wishWords ? (
                      <div className="flex flex-col gap-1.5">
                        <p className="line-clamp-3 text-sm leading-relaxed font-medium text-zinc-200 italic">
                          {wishWords}
                        </p>
                        {wishUserNickname && (
                          <span className="self-end text-[10px] text-zinc-500">
                            {t("vipSign.commentFrom", { nickname: wishUserNickname })}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-500 italic">
                        {t("vipSign.recommendedSong")}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Album Cover with buttons */}
                <div className="flex shrink-0 items-center justify-center">
                  <div className="group/cover relative size-40 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl">
                    {songCover ? (
                      <Image
                        width={160}
                        height={160}
                        src={songCover}
                        alt={songInfo?.songName ?? ""}
                        className="size-full object-cover transition-transform duration-500 group-hover/cover:scale-105"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-zinc-700">
                        <X className="size-10" />
                      </div>
                    )}

                    {songId && (
                      <button
                        type="button"
                        onClick={handlePlay}
                        className="absolute right-3 bottom-3 flex size-10 translate-y-3 cursor-pointer items-center justify-center rounded-full bg-[#1ed760] text-black opacity-0 shadow-xl transition-all duration-300 group-hover/cover:translate-y-0 group-hover/cover:opacity-100 hover:scale-105 hover:bg-[#3be477]"
                        title={t("contextMenu.play")}
                      >
                        <Play className="ml-0.5 size-5 fill-current" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Dotted Divider */}
              <div className="my-2 h-0.5 w-full bg-[repeating-linear-gradient(to_right,rgba(255,255,255,0.2)_0,rgba(255,255,255,0.2)_2px,transparent_2px,transparent_10px)]" />

              {/* Footer Section */}
              <div className="flex w-full flex-col items-center justify-between gap-4 sm:flex-row">
                {/* Monthly signed */}
                <div className="text-left">
                  <div className="mb-1 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
                    {t("vipSign.monthlyCheckIn")}
                  </div>
                  <div className="flex items-baseline text-2xl font-black text-white">
                    {consecutiveDays}
                    <span className="ml-0.5 text-xs font-normal text-zinc-400">
                      {t("vipSign.days")}
                    </span>
                  </div>
                </div>

                <div className="hidden h-8 w-px bg-white/10 sm:block" />

                {/* QR Code */}
                <div className="flex max-w-60 items-center gap-3 rounded-2xl border border-white/5 bg-white/5 p-2.5">
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] font-medium text-zinc-500">
                      {t("vipSign.qrGuide")}
                    </span>
                    <span className="mt-0.5 text-xs font-semibold text-rose-500">
                      {t("vipSign.qrHint")}
                    </span>
                  </div>
                  <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-0.5">
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
}
