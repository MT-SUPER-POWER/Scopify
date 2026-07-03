"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Play, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getTimeTheme } from "@/hooks/home/useHomeData";
import { getMusicComments } from "@/lib/api/comment";
import { getSongDetail } from "@/lib/api/track";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { VipSignRecord } from "@/types/api/vipSign";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 连续签到天数计算
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function calcConsecutiveDays(records: VipSignRecord[]): number {
  const todayIdx = records.findIndex((r) => r.today);
  if (todayIdx === -1) return 0;
  let count = 0;
  for (let i = todayIdx; i >= 0; i--) {
    if (records[i].recordId > 0) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Props
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface VipSignModalProps {
  open: boolean;
  onClose: () => void;
  signRecords: VipSignRecord[];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function VipSignModal({ open, onClose, signRecords }: VipSignModalProps) {
  const { t } = useI18n();

  // 找到今天的记录（today: true）
  const todayRecord = useMemo(() => signRecords.find((r) => r.today), [signRecords]);
  const todaySongId = todayRecord?.songId;
  const todayCover = todayRecord?.songCover ?? "";
  const consecutiveDays = useMemo(() => calcConsecutiveDays(signRecords), [signRecords]);

  // 热门评论
  const [hotComment, setHotComment] = useState<{ content: string; nickname: string } | null>(null);
  // 歌曲信息
  const [songInfo, setSongInfo] = useState<{ name: string; artist: string } | null>(null);

  // 获取时间渐变主题
  const theme = useMemo(() => getTimeTheme(), []);

  // 格式化日期：07月 / 04日
  const formattedDate = useMemo(() => {
    const targetStr = todayRecord?.timeStr ?? new Date().toISOString().slice(0, 10);
    const dateObj = new Date(targetStr);
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    return { mm, dd };
  }, [todayRecord]);

  // 1. 获取歌曲详情 (名字与歌手)
  useEffect(() => {
    if (!todaySongId) return;
    getSongDetail(todaySongId)
      .then((res) => {
        const song = res?.data?.songs?.[0];
        if (song) {
          const artistName = song.ar?.map((a: any) => a.name).join("/") ?? "";
          setSongInfo({
            name: song.name,
            artist: artistName,
          });
        }
      })
      .catch(() => {
        /* 静默失败 */
      });
  }, [todaySongId]);

  // 2. 获取歌曲热评
  useEffect(() => {
    if (!todaySongId) return;
    getMusicComments({ id: todaySongId, limit: 1 })
      .then((res) => {
        const hot = res.data?.hotComments?.[0];
        if (hot) {
          setHotComment({
            content: hot.content,
            nickname: hot.user?.nickname ?? "",
          });
        }
      })
      .catch(() => {
        /* 静默失败 */
      });
  }, [todaySongId]);

  // 播放当前歌曲
  const handlePlay = useCallback(async () => {
    if (!todaySongId) return;
    const store = usePlayerStore.getState();
    const songRes = await getSongDetail(todaySongId);
    const song = songRes?.data?.songs?.[0];
    if (!song) return;
    store.playFromSong(song, [song]);
    onClose();
  }, [todaySongId, onClose]);

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
            className="relative w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl bg-[#121212] border border-white/10"
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
          >
            {/* Background Theme Gradient System */}
            <div
              className={cn(
                "absolute top-0 left-0 right-0 bg-linear-to-b opacity-50 z-0 pointer-events-none",
                theme.gradient,
                "h-full",
              )}
            />

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-6 right-6 z-20 p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content Area */}
            <div className="relative z-10 p-8 flex flex-col gap-6 text-white select-none">
              {/* Header: Date */}
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black">{formattedDate.mm}</span>
                <span className="text-xs text-zinc-500 font-medium">{t("vipSign.month")}</span>
                <span className="text-zinc-600 px-1 font-light">/</span>
                <span className="text-2xl font-black">{formattedDate.dd}</span>
                <span className="text-xs text-zinc-500 font-medium">{t("vipSign.day")}</span>
              </div>

              {/* Main Body */}
              <div className="flex flex-col md:flex-row gap-6 w-full items-stretch min-h-40">
                {/* Left: Song details + Quote */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-2xl font-black text-white tracking-tight">
                        {songInfo?.name ?? t("vipSign.recommendedSong")}
                      </span>
                      {songInfo?.artist && (
                        <span className="text-xs text-zinc-400 font-medium">
                          - {songInfo.artist}
                        </span>
                      )}
                    </div>
                    {/* Line Divider */}
                    <div className="w-full border-t border-white/10 my-3" />
                  </div>

                  {/* Comment Quote */}
                  <div className="relative pl-6 py-2 flex-1 flex flex-col justify-center">
                    <span className="absolute left-0 top-0 text-5xl font-serif text-white/10 select-none leading-none">
                      “
                    </span>
                    {hotComment ? (
                      <div className="flex flex-col gap-1.5">
                        <p className="text-sm text-zinc-200 font-medium leading-relaxed italic line-clamp-3">
                          {hotComment.content}
                        </p>
                        <span className="text-[10px] text-zinc-500 self-end">
                          {t("vipSign.commentFrom", { nickname: hotComment.nickname })}
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-500 italic">
                        {t("common.status.loading")}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Album Cover with buttons */}
                <div className="shrink-0 flex items-center justify-center">
                  <div className="relative w-40 h-40 rounded-2xl overflow-hidden shadow-2xl border border-white/10 group/cover bg-zinc-900">
                    {todayCover ? (
                      <Image
                        width={160}
                        height={160}
                        src={todayCover}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/cover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-700">
                        <X className="w-10 h-10" />
                      </div>
                    )}

                    {todaySongId && (
                      <button
                        type="button"
                        onClick={handlePlay}
                        className="absolute bottom-3 right-3 w-10 h-10 bg-[#1ed760] rounded-full flex items-center justify-center text-black opacity-0 translate-y-3 group-hover/cover:opacity-100 group-hover/cover:translate-y-0 transition-all duration-300 hover:scale-105 hover:bg-[#3be477] shadow-xl cursor-pointer"
                        title={t("contextMenu.play")}
                      >
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Dotted Divider */}
              <div className="w-full h-0.5 my-2 bg-[repeating-linear-gradient(to_right,rgba(255,255,255,0.2)_0,rgba(255,255,255,0.2)_2px,transparent_2px,transparent_10px)]" />

              {/* Footer Section */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center w-full">
                {/* Monthly signed */}
                <div className="text-left">
                  <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-1">
                    {t("vipSign.monthlyCheckIn")}
                  </div>
                  <div className="text-2xl font-black text-white flex items-baseline">
                    {consecutiveDays}
                    <span className="text-xs text-zinc-400 font-normal ml-0.5">
                      {t("vipSign.days")}
                    </span>
                  </div>
                </div>

                <div className="h-8 w-px bg-white/10 hidden sm:block" />

                {/* QR Code */}
                <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl p-2.5 max-w-60">
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] text-zinc-500 font-medium">
                      {t("vipSign.qrGuide")}
                    </span>
                    <span className="text-xs font-semibold text-rose-500 mt-0.5">
                      {t("vipSign.qrHint")}
                    </span>
                  </div>
                  <div className="w-10 h-10 bg-white rounded-lg p-0.5 overflow-hidden flex items-center justify-center shrink-0">
                    <Image
                      width={40}
                      height={40}
                      src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://music.163.com/m/header"
                      alt="QR Code"
                      className="w-full h-full object-cover"
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
