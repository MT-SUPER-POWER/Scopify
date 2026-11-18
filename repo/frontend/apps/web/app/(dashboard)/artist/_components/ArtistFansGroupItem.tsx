"use client";

import { Users } from "lucide-react";
import Link from "next/link";

import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useArtistFansGroupStatus } from "@/hooks/fansGroup/useFansGroupQueries";
import { useTranslation } from "react-i18next";

interface Props {
  artistId: string;
}

/** The menu entry for the artist's fans group, which is a NetEase social feature. */
export function ArtistFansGroupItem({ artistId }: Props) {
  const { t } = useTranslation();
  const fansGroupStatus = useArtistFansGroupStatus(artistId);

  if (!fansGroupStatus.isJoined || !fansGroupStatus.fansGroupId) return null;

  return (
    <>
      <DropdownMenuItem asChild>
        <Link
          href={`/social?group=${fansGroupStatus.fansGroupId}`}
          className="flex cursor-pointer items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Users className="size-4" />
            <span>{t("artist.action.fansGroup")}</span>
          </div>
          {fansGroupStatus.level && (
            <span className="rounded bg-surface-elevated px-1.5 py-0.5 text-[10px] font-semibold text-content-muted">
              Lv.{fansGroupStatus.level}
            </span>
          )}
        </Link>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
    </>
  );
}
