import { Disc3 } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/store/module/i18n";
import type { ProfilePlaylistTileProps } from "@/types/social/components";
import s from "@/components/social/Social.module.css";

export function ProfilePlaylistTile({ item, caption }: ProfilePlaylistTileProps) {
  const { t } = useI18n();
  return (
    <Link href={"/playlist?id=" + item.id} scroll={false} className={s.playlistTile}>
      <span className={s.cover}>
        {item.cover ? (
          <img src={item.cover} alt="" loading="lazy" referrerPolicy="no-referrer" />
        ) : (
          <Disc3 />
        )}
      </span>
      <strong>{item.name}</strong>
      <p>
        {t("social.tracks", { count: item.count })} · {caption}
      </p>
    </Link>
  );
}
