import { Disc3 } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import type { ProfilePlaylistTileProps } from "@/types/social/components";
import {
  profilePlaylistCoverClass,
  profilePlaylistTileClass,
} from "@/components/social/socialClasses";

export function ProfilePlaylistTile({ item, caption }: ProfilePlaylistTileProps) {
  const { t } = useTranslation();
  return (
    <Link href={"/playlist?id=" + item.id} scroll={false} className={profilePlaylistTileClass}>
      <span className={profilePlaylistCoverClass}>
        {item.cover ? (
          <img src={item.cover} alt="" loading="lazy" referrerPolicy="no-referrer" />
        ) : (
          <Disc3 />
        )}
      </span>
      <strong className="block truncate text-[14px]">{item.name}</strong>
      <p className="mt-[5px] text-[12px] text-muted-foreground">
        {t("social.tracks", { count: item.count })} · {caption}
      </p>
    </Link>
  );
}
