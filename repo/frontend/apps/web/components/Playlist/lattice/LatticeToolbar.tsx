"use client";

import { Crosshair, List, PanelsTopLeft } from "lucide-react";
import { useI18n } from "@/store/module/i18n";
import type { LatticeToolbarProps } from "@/types/components/playlistLattice";
import styles from "./PlaylistLattice.module.css";

export function LatticeToolbar({
  title,
  count,
  canLocate,
  onLocate,
  onClose,
}: LatticeToolbarProps) {
  const { t } = useI18n();
  return (
    <header className={styles.toolbar}>
      <div className={styles.identity}>
        <span className={styles.wordmark}>
          <PanelsTopLeft size={14} /> LATTICE <span> / {String(count).padStart(2, "0")}</span>
        </span>
        <h1 title={title}>{title}</h1>
      </div>
      <div className={styles.tools}>
        {canLocate && (
          <button
            type="button"
            onClick={onLocate}
            title={t("playlist.lattice.locate")}
            aria-label={t("playlist.lattice.locate")}
          >
            <Crosshair size={17} />
          </button>
        )}
        <button type="button" onClick={onClose} className={styles.returnButton}>
          <List size={17} />
          <span>{t("playlist.lattice.back")}</span>
          <kbd>Esc</kbd>
        </button>
      </div>
    </header>
  );
}
