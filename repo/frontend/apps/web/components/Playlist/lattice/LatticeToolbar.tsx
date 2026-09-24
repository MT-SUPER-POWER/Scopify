"use client";

import { Crosshair, List } from "lucide-react";
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
      <h1 className="sr-only">
        {title} · {count}
      </h1>
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
        <button
          type="button"
          onClick={onClose}
          aria-label={t("playlist.lattice.back")}
          title={`${t("playlist.lattice.back")} · Esc`}
        >
          <List size={17} />
        </button>
      </div>
    </header>
  );
}
