"use client";

import { useI18n } from "@/store/module/i18n";
import type { VipSignTicketContentProps } from "@/types/components/vipSign";
import styles from "./VipSignTicket.module.css";

export function VipSignTicketContent({ todayRecord }: VipSignTicketContentProps) {
  const { t } = useI18n();
  const name = todayRecord?.songInfo?.songName ?? t("vipSign.recommendedSong");
  const split = name.match(/^(.*?)\s*(\([^()]+\)|（[^（）]+）)$/);
  return (
    <div className={styles.mainContent}>
      <header className={styles.masthead}>
        <span className={styles.seal}>N</span>
        <span className={styles.brand}>SCOPIFY</span>
        <span className={styles.edition}>DAILY MUSIC</span>
        <span className={styles.ticketLabel}>{t("vipSign.ticketTitle")}</span>
      </header>
      <div className={styles.song}>
        <h2 className={styles.songTitle}>{split?.[1] || name}</h2>
        {split && <p className={styles.subtitle}>{split[2]}</p>}
        <p className={styles.artist}>{todayRecord?.songInfo?.artistName}</p>
      </div>
      <blockquote className={styles.quote}>
        <div className={styles.quoteBody}>
          <span className={styles.quoteMark} aria-hidden="true">
            “
          </span>
          <p>{todayRecord?.wishWords ?? t("vipSign.recommendedSong")}</p>
        </div>
        {todayRecord?.wishUserNickname && (
          <cite>{t("vipSign.commentFrom", { nickname: todayRecord.wishUserNickname })}</cite>
        )}
      </blockquote>
      <footer className={styles.footer}>
        <span>
          {t("vipSign.monthlyCheckIn")}{" "}
          <strong>{String(todayRecord?.monthCheckInTotalDay ?? 0).padStart(2, "0")}</strong>{" "}
          {t("vipSign.days")}
        </span>
        <span className={styles.footerRule} />
        {todayRecord?.recordId != null && (
          <span className={styles.serial}>No. {todayRecord.recordId}</span>
        )}
      </footer>
    </div>
  );
}
