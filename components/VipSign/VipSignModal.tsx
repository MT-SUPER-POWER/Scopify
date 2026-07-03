"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiCalendar } from "react-icons/fi";
import { PiChatCircleDotsBold, PiPlayCircleFill } from "react-icons/pi";
import { getMusicComments } from "@/lib/api/comment";
import { getSongDetail } from "@/lib/api/track";
import { usePlayerStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { VipSignRecord } from "@/types/api/vipSign";

const BackgroundRender = dynamic(
  () => import("@applemusic-like-lyrics/react").then((mod) => mod.BackgroundRender),
  { ssr: false },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 日期格式化
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const WEEK_DAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const WEEK_DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDate(timeStr: string, locale: string) {
  const d = new Date(timeStr);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const wd = locale === "en-US" ? WEEK_DAYS_EN[d.getDay()] : WEEK_DAYS[d.getDay()];

  if (locale === "en-US") {
    return `${wd}, ${monthName(d)} ${day}, ${y}`;
  }
  return `${y}年${m}月${day}日 ${wd}`;
}

function monthName(d: Date) {
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][
    d.getMonth()
  ];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 连续签到天数计算
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function calcConsecutiveDays(records: VipSignRecord[]): number {
  // 从 today: true 的记录往前统计 recordId > 0 的连续天数
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
  const { t, locale } = useI18n();

  // 找到今天的记录（today: true）
  const todayRecord = useMemo(() => signRecords.find((r) => r.today), [signRecords]);
  const todaySongId = todayRecord?.songId;
  const todayCover = todayRecord?.songCover ?? "";
  const consecutiveDays = useMemo(() => calcConsecutiveDays(signRecords), [signRecords]);

  // 热门评论
  const [hotComment, setHotComment] = useState<{ content: string; nickname: string } | null>(null);

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
        /* 静默失败，不影响卡片展示 */
      });
  }, [todaySongId]);

  // 播放当前歌曲
  const handlePlay = useCallback(async () => {
    if (!todaySongId) return;
    const store = usePlayerStore.getState();
    // 如果当前队列没有这首歌，创建一个只包含此歌曲的队列
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
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70" onClick={onClose} />

          {/* Card */}
          <motion.div
            className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl bg-[#1a1a1a]"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Background Layer */}
            {todayCover ? (
              <div className="absolute inset-0 z-0 pointer-events-none">
                <div
                  className="absolute inset-0 opacity-60 scale-[1.2]"
                  style={{ filter: "blur(24px) brightness(0.6)" }}
                >
                  <BackgroundRender
                    album={todayCover}
                    playing={false}
                    hasLyric={false}
                    renderScale={0.35}
                    staticMode
                  />
                </div>
                <div className="absolute inset-0 bg-black/20" />
              </div>
            ) : (
              <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a]" />
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 z-20 p-2 rounded-full bg-black/30 text-white/70 hover:text-white hover:bg-black/50 transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content */}
            <div className="relative z-10 p-8 text-white flex flex-col items-center gap-5">
              {/* Date */}
              <div className="text-center">
                <div className="text-2xl font-bold tracking-tight">
                  {signRecords.length > 0
                    ? formatDate(signRecords.find((r) => r.today)?.timeStr ?? "", locale)
                    : formatDate(new Date().toISOString().slice(0, 10), locale)}
                </div>
                <div className="mt-1 h-px w-16 mx-auto bg-white/20" />
              </div>

              {/* Today's Song Title */}
              <div className="text-center">
                <div className="text-xs uppercase tracking-widest text-white/50 mb-1">
                  {t("vipSign.recommendedSong")}
                </div>
              </div>

              {/* Main: Quote + Cover */}
              <div className="flex gap-4 w-full items-stretch">
                {/* Left: Hot Comment Quote */}
                <div className="flex-1 min-w-0 bg-white/5 backdrop-blur-sm rounded-xl p-4 flex flex-col justify-center">
                  {hotComment ? (
                    <>
                      <div className="text-sm italic text-white/80 leading-relaxed line-clamp-4">
                        &ldquo;{hotComment.content}&rdquo;
                      </div>
                      <div className="mt-2 text-xs text-white/40 text-right">
                        &mdash; {hotComment.nickname}
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-white/30 text-center">
                      {t("common.status.loading")}
                    </div>
                  )}
                </div>

                {/* Right: Song Cover + Actions */}
                <div className="shrink-0 flex flex-col items-center gap-2">
                  <div className="w-24 h-24 rounded-xl overflow-hidden shadow-lg bg-black/30 ring-1 ring-white/10">
                    {todayCover ? (
                      <Image
                        width={96}
                        height={96}
                        src={todayCover}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20">
                        <FiCalendar className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handlePlay}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                      title={t("contextMenu.play")}
                    >
                      <PiPlayCircleFill className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                      title={t("contextMenu.comments")}
                      onClick={() => {
                        if (todaySongId) {
                          window.location.href = `/comment?songId=${todaySongId}`;
                        }
                      }}
                    >
                      <PiChatCircleDotsBold className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Consecutive Days */}
              <div className="flex items-center gap-2 text-sm text-white/70 bg-white/5 rounded-full px-4 py-1.5">
                <FiCalendar className="w-4 h-4" />
                <span>{t("vipSign.consecutiveDays", { days: consecutiveDays })}</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
