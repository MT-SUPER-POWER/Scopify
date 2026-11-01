"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

import { LISTENING_REPORT_MONTH_NAMES } from "@/constants/listeningReport";
import { useReceiptTilt } from "@/hooks/listeningReport/useReceiptTilt";
import { formatMinutesText } from "@/lib/listeningReport/dateHelpers";
import type { ListeningReportReceiptProps } from "@/types/listeningReport/components";
import styles from "./ListeningReportReceipt.module.css";

const PERIOD_TITLES = { month: "月度", week: "周度", year: "年度" } as const;

function formatDate(time: number) {
  const date = new Date(time);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

/** Stable pseudo-random bar widths so the same report always prints the same barcode. */
function getBarcode(seed: string) {
  let hash = 2166136261;
  for (const char of seed) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return Array.from({ length: 64 }, () => {
    hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
    return 1 + ((hash >>> 0) % 3);
  });
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.row}>
      <span>{label}</span>
      <span className={styles.leader} aria-hidden="true" />
      <span className={styles.rowValue}>{value}</span>
    </div>
  );
}

export function ListeningReportReceipt({
  interactive = true,
  nickname,
  paperRef,
  selectedMonth,
  summary,
}: ListeningReportReceiptProps) {
  const tilt = useReceiptTilt(interactive);
  const { period } = summary;
  const year = summary.reportYear ?? selectedMonth.year;
  const month = summary.reportMonth ?? selectedMonth.month;

  const periodLabel =
    period === "year"
      ? `${year} 年度`
      : period === "week"
        ? "本周"
        : `${year}年${LISTENING_REPORT_MONTH_NAMES[month - 1] ?? "本月"}`;

  const dateRange =
    summary.startTime && summary.endTime
      ? `${formatDate(summary.startTime)} — ${formatDate(summary.endTime)}`
      : periodLabel;

  const total =
    summary.playDurationMinutes && summary.playDurationMinutes > 0
      ? formatMinutesText(summary.playDurationMinutes)
      : (summary.durationText ?? "—");

  const serial = useMemo(() => {
    let hash = 0;
    for (const char of `${nickname}${period}${summary.startTime ?? ""}`)
      hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    return `${year}${String(month).padStart(2, "0")}${String(hash % 100000).padStart(5, "0")}`;
  }, [month, nickname, period, summary.startTime, year]);

  const bars = useMemo(() => getBarcode(serial), [serial]);
  const songs = summary.topSongsList.slice(0, 5);
  const covers = summary.wallpaperUrls.slice(0, 4);

  return (
    <div className={styles.stage} onPointerMove={tilt.tilt} onPointerLeave={tilt.reset}>
      <motion.div
        aria-hidden="true"
        className={styles.floorShadow}
        style={{ x: tilt.shadowX, y: tilt.shadowY }}
      />
      <motion.div
        className={styles.receipt}
        style={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY }}
      >
        <motion.div
          ref={paperRef}
          className={styles.paper}
          initial={tilt.reducedMotion ? false : { clipPath: "inset(0 0 100% 0)", y: -36 }}
          animate={{ clipPath: "inset(0 0 0% 0)", y: 0 }}
          transition={{ duration: 1.25, ease: [0.45, 0, 0.2, 1] }}
        >
          <div className={styles.content}>
            <header className={styles.masthead}>
              <span className={styles.logo}>✦ SCOPIFY ✦</span>
              <span className={styles.store}>RECORD STORE</span>
              <span className={styles.caption}>{PERIOD_TITLES[period]}听歌消费凭证</span>
            </header>

            <div className={styles.meta}>
              <ReceiptRow label="单号" value={`No.${serial}`} />
              <ReceiptRow label="账期" value={dateRange} />
              <ReceiptRow label="顾客" value={nickname} />
              <ReceiptRow label="收银" value="SCOPIFY DJ 01" />
            </div>

            <hr className={styles.dashed} />

            <div className={styles.itemsHead}>
              <span>品名 ITEM</span>
              <span>数量 QTY</span>
            </div>
            {songs.length > 0 ? (
              <ol className={styles.items}>
                {songs.map((song) => (
                  <li key={song.songId} className={styles.item}>
                    <span className={styles.itemRank}>{String(song.rank).padStart(2, "0")}</span>
                    <span className={styles.itemName}>
                      {song.songName}
                      {song.artists && <small> · {song.artists}</small>}
                    </span>
                    <span className={styles.itemQty}>{song.playCountText || "×1"}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className={styles.empty}>本期暂无曲目明细</p>
            )}

            {covers.length > 0 && (
              <div className={styles.covers}>
                {covers.map((url) => (
                  <img key={url} alt="" src={url} draggable={false} />
                ))}
              </div>
            )}

            <hr className={styles.dashed} />

            <div className={styles.meta}>
              <ReceiptRow label="活跃天数" value={`${summary.activeDays ?? 0} 天`} />
              <ReceiptRow label="曲目总数" value={`${summary.songCount ?? 0} 首`} />
              <ReceiptRow label="偏爱曲风" value={summary.topStyle?.genreName || "—"} />
              <ReceiptRow label="最常光顾" value={summary.topArtist?.title || "—"} />
            </div>

            <hr className={styles.double} />

            <div className={styles.total}>
              <span>合计 TOTAL</span>
              <strong>{total}</strong>
            </div>
            <div className={styles.meta}>
              <ReceiptRow label="实付" value="全部心动" />
              <ReceiptRow label="找零" value="0.00 烦恼" />
            </div>

            {summary.title && <p className={styles.stamp}>{summary.title}</p>}

            <hr className={styles.dashed} />

            <footer className={styles.footer}>
              <div className={styles.barcode} aria-hidden="true">
                {bars.map((width, index) => (
                  <span
                    key={index}
                    style={{ width: width * 1.4, opacity: index % 2 === 0 ? 1 : 0 }}
                  />
                ))}
              </div>
              <span className={styles.serial}>{serial}</span>
              <p>谢谢惠顾 · 欢迎再次收听</p>
              <p className={styles.thanks}>THANK YOU FOR LISTENING</p>
            </footer>
          </div>
          <motion.div
            aria-hidden="true"
            data-receipt-capture-exclude
            className={styles.glare}
            style={{ background: tilt.glare }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
