"use client";

import { Disc3, ListPlus, LoaderCircle, Play } from "lucide-react";
import Link from "next/link";
import { useSocialPlayback } from "@/hooks/social/useSocialPlayback";
import { useI18n } from "@/store/module/i18n";
import type { SocialResourceProps } from "@/types/components/social";
import s from "./Social.module.css";

export function SocialResourceCard({ resource, compact }: SocialResourceProps) {
  const { t } = useI18n(),
    { play, pending, playable } = useSocialPlayback(resource);
  const href =
    resource.kind === "playlist"
      ? "/playlist?id=" + resource.id
      : resource.kind === "album"
        ? "/album?id=" + resource.id
        : resource.kind === "song"
          ? "/comment?songId=" + resource.id
          : undefined;
  return (
    <div className={s.resource}>
      <span className={s.cover}>
        {resource.cover ? (
          <img src={resource.cover} alt="" loading="lazy" referrerPolicy="no-referrer" />
        ) : (
          <Disc3 className="size-7 text-content-muted" />
        )}
      </span>
      <div className={s.resourceText}>
        {href ? (
          <Link href={href} scroll={false}>
            <strong>{resource.name}</strong>
          </Link>
        ) : (
          <strong>{resource.name}</strong>
        )}
        {resource.subtitle && <p className="truncate">{resource.subtitle}</p>}
        <p>
          {t(
            ("social." + resource.kind) as
              | "social.song"
              | "social.playlist"
              | "social.album"
              | "social.program"
              | "social.video",
          )}
          {resource.song?.dt
            ? " · " +
              Math.floor(resource.song.dt / 60_000) +
              ":" +
              String(Math.floor(resource.song.dt / 1000) % 60).padStart(2, "0")
            : ""}
        </p>
      </div>
      {playable && (
        <button
          type="button"
          className={s.play}
          disabled={pending}
          aria-label={t("social.play") + " " + resource.name}
          onClick={() => void play()}
        >
          {pending ? <LoaderCircle className="animate-spin" /> : <Play className="fill-current" />}
        </button>
      )}
      {playable && !compact && (
        <button
          type="button"
          className={s.iconButton}
          disabled={pending}
          title={t("social.queue")}
          aria-label={t("social.queue")}
          onClick={() => void play(true)}
        >
          <ListPlus />
        </button>
      )}
    </div>
  );
}
