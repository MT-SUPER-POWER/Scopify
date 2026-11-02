"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

import { LISTENING_REPORT_MONTH_NAMES } from "@/constants/listeningReport";
import { useReceiptTilt } from "@/hooks/listeningReport/useReceiptTilt";
import { formatMinutesText } from "@/lib/listeningReport/dateHelpers";
import type { ListeningReportReceiptProps } from "@/types/listeningReport/components";

const PERIOD_TITLES = { month: "月度", week: "周度", year: "年度" } as const;

/** Thermal printers print in a narrow mono face; CJK falls back to the system sans. */
const RECEIPT_FONT =
  '"SFMono-Regular", "Cascadia Code", Menlo, Consolas, "PingFang SC", "Noto Sans Mono CJK SC", monospace';

/** Thermal-paper grain plus the shading of a gently curled slip. */
const PAPER_GRAIN = [
  "linear-gradient(90deg, rgb(0 0 0 / 7%), transparent 9%, transparent 82%, rgb(0 0 0 / 9%))",
  "linear-gradient(to bottom, transparent 78%, rgb(120 110 90 / 12%))",
  'url("/images/vip-sign/concert-paper.png") center / 420px auto',
].join(", ");

const dashedRule = "dash-rule-x m-0 h-px w-full border-0 opacity-60";

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
    <div className="flex min-w-0 items-baseline gap-1.5">
      <span>{label}</span>
      <span
        aria-hidden="true"
        className="min-w-3 flex-1 border-b border-dotted border-(--ink)/35"
      />
      <span className="max-w-[68%] truncate font-semibold">{value}</span>
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
    <div
      className="relative grid place-items-center pt-2 pb-11 [--ink-faded:#6d6a62] [--ink:#26241f] perspective-distant motion-reduce:perspective-none"
      onPointerMove={tilt.tilt}
      onPointerLeave={tilt.reset}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[8%_14%_10%] rounded-[40%] bg-black/55 blur-[28px]"
        style={{ x: tilt.shadowX, y: tilt.shadowY }}
      />
      {/* Resting pose: a slip lying slightly back on the counter, tilted by hand. */}
      <motion.div
        className="relative w-[min(340px,100%)] rotate-[-1.2deg] transform-3d"
        style={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY }}
      >
        <motion.div
          ref={paperRef}
          className="relative isolate bg-[#fbfaf6] text-(--ink) torn-edge-y"
          initial={tilt.reducedMotion ? false : { clipPath: "inset(0 0 100% 0)", y: -36 }}
          animate={{ clipPath: "inset(0 0 0% 0)", y: 0 }}
          transition={{ duration: 1.25, ease: [0.45, 0, 0.2, 1] }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 opacity-55 mix-blend-multiply grayscale"
            style={{ background: PAPER_GRAIN }}
          />
          {/* Slight ink bleed of a thermal print head. */}
          <div
            className="flex flex-col gap-3.5 px-6.5 pt-8.5 pb-9.5 text-xs leading-normal [text-shadow:0_0_0.6px_rgb(38_36_31/45%)]"
            style={{ fontFamily: RECEIPT_FONT }}
          >
            <header className="flex flex-col items-center gap-0.5 text-center">
              <span className="text-[22px] font-extrabold tracking-[0.12em]">✦ SCOPIFY ✦</span>
              <span className="pl-[0.5em] text-[11px] tracking-[0.5em]">RECORD STORE</span>
              <span className="mt-1.5 border border-current px-2.5 py-px text-[11px] tracking-[0.2em]">
                {PERIOD_TITLES[period]}听歌消费凭证
              </span>
            </header>

            <div className="flex flex-col gap-0.5">
              <ReceiptRow label="单号" value={`No.${serial}`} />
              <ReceiptRow label="账期" value={dateRange} />
              <ReceiptRow label="顾客" value={nickname} />
              <ReceiptRow label="收银" value="SCOPIFY DJ 01" />
            </div>

            <hr className={dashedRule} />

            <div className="flex justify-between text-[10px] tracking-widest text-(--ink-faded)">
              <span>品名 ITEM</span>
              <span>数量 QTY</span>
            </div>
            {songs.length > 0 ? (
              <ol className="-mt-1.5 flex flex-col gap-1.5">
                {songs.map((song) => (
                  <li
                    key={song.songId}
                    className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-2"
                  >
                    <span className="text-(--ink-faded)">{String(song.rank).padStart(2, "0")}</span>
                    <span className="truncate font-semibold">
                      {song.songName}
                      {song.artists && (
                        <small className="text-[10px] font-normal text-(--ink-faded)">
                          {` · ${song.artists}`}
                        </small>
                      )}
                    </span>
                    <span className="text-[11px] whitespace-nowrap">
                      {song.playCountText || "×1"}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="-mt-1.5 text-center text-(--ink-faded)">本期暂无曲目明细</p>
            )}

            {/* Covers printed by a thermal head: grayscale, high contrast, ink sinking into paper. */}
            {covers.length > 0 && (
              <div className="grid grid-cols-4 gap-1.5">
                {covers.map((url) => (
                  <img
                    key={url}
                    alt=""
                    src={url}
                    draggable={false}
                    className="aspect-square w-full object-cover opacity-90 mix-blend-multiply brightness-105 contrast-135 grayscale"
                  />
                ))}
              </div>
            )}

            <hr className={dashedRule} />

            <div className="flex flex-col gap-0.5">
              <ReceiptRow label="活跃天数" value={`${summary.activeDays ?? 0} 天`} />
              <ReceiptRow label="曲目总数" value={`${summary.songCount ?? 0} 首`} />
              <ReceiptRow label="偏爱曲风" value={summary.topStyle?.genreName || "—"} />
              <ReceiptRow label="最常光顾" value={summary.topArtist?.title || "—"} />
            </div>

            <hr className="m-0 h-1 w-full border-x-0 border-y border-(--ink) bg-transparent" />

            <div className="flex flex-col items-center gap-0.5 text-center">
              <span className="text-[11px] tracking-[0.3em] text-(--ink-faded)">合计 TOTAL</span>
              <strong className="text-[26px] leading-tight font-extrabold tracking-tight">
                {total}
              </strong>
            </div>
            <div className="flex flex-col gap-0.5">
              <ReceiptRow label="实付" value="全部心动" />
              <ReceiptRow label="找零" value="0.00 烦恼" />
            </div>

            {/* A rubber stamp pressed on top of the print, slightly askew. */}
            {summary.title && (
              <p className="my-0.5 -rotate-6 self-center rounded-md border-2 border-[#c2412d] px-3.5 py-1 text-[13px] font-extrabold tracking-[0.14em] text-[#c2412d] opacity-80 mix-blend-multiply [text-shadow:none]">
                {summary.title}
              </p>
            )}

            <hr className={dashedRule} />

            <footer className="flex flex-col items-center gap-1 text-center">
              <div className="flex h-11.5 w-full items-stretch justify-center" aria-hidden="true">
                {bars.map((width, index) => (
                  <span
                    key={index}
                    className="block flex-none bg-(--ink)"
                    style={{ width: width * 1.4, opacity: index % 2 === 0 ? 1 : 0 }}
                  />
                ))}
              </div>
              <span className="text-[11px] tracking-[0.4em]">{serial}</span>
              <p className="mt-1.5 tracking-[0.08em]">谢谢惠顾 · 欢迎再次收听</p>
              <p className="text-[10px] tracking-[0.18em] text-(--ink-faded)">
                THANK YOU FOR LISTENING
              </p>
            </footer>
          </div>
          <motion.div
            aria-hidden="true"
            data-receipt-capture-exclude
            className="pointer-events-none absolute inset-0 mix-blend-soft-light"
            style={{ background: tilt.glare }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
