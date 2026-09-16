"use client";

import { Play } from "lucide-react";
import Image from "next/image";
import { useI18n } from "@/store/module/i18n";
import type { VipSignTicketStubProps } from "@/types/components/vipSign";
import styles from "./VipSignTicket.module.css";

export function VipSignTicketStub({ todayRecord, onPlay, isPlaying }: VipSignTicketStubProps) {
  const { t } = useI18n();
  const date = new Date(todayRecord?.time ?? Date.now());
  const song = todayRecord?.songInfo;
  return (
    <div className={styles.stubContent}>
      <span className={styles.admission}>✦ &nbsp; ADMIT ONE &nbsp; ✦</span>
      <time
        className={styles.date}
        dateTime={`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`}
      >
        {String(date.getMonth() + 1).padStart(2, "0")}.{String(date.getDate()).padStart(2, "0")}
      </time>
      <span className={styles.year}>{date.getFullYear()}</span>
      <button
        type="button"
        className={styles.cover}
        onClick={onPlay}
        disabled={!song?.songId || isPlaying}
        aria-label={t("contextMenu.play")}
      >
        {song?.cover && (
          <Image src={song.cover} alt={song.songName} width={180} height={180} draggable={false} />
        )}
        <span className={styles.play}>
          <Play size={22} fill="currentColor" />
        </span>
      </button>
      <a
        className={styles.qr}
        href="https://music.163.com/m/header"
        target="_blank"
        rel="noreferrer"
        title={t("vipSign.qrHint")}
      >
        <Image
          width={60}
          height={60}
          draggable={false}
          src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://music.163.com/m/header"
          alt={t("vipSign.qrAlt")}
        />
        <span>{t("vipSign.memberCenter")}</span>
      </a>
    </div>
  );
}
