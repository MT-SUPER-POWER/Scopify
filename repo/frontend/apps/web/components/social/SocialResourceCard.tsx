"use client";

import { Disc3, ListPlus, LoaderCircle, Play } from "lucide-react";
import Link from "next/link";
import { useSocialPlayback } from "@/hooks/social/useSocialPlayback";
import { useTranslation } from "react-i18next";

import type { SocialResourceProps } from "@/types/social/components";
import { socialIconButtonClass } from "./socialClasses";

const resourceTitleClass = "block truncate text-[14px] font-[650]";
const resourceMetaClass = "mt-[5px] text-[12px] text-muted-foreground";

export function SocialResourceCard({ resource, compact }: SocialResourceProps) {
  const { t } = useTranslation(),
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
    <div
      data-slot="social-resource"
      className="my-2.5 flex min-w-0 items-center gap-4 rounded-[10px] border border-foreground/10 bg-foreground/2 p-[7px] max-[768px]:gap-2.5"
    >
      <span className="flex size-[82px] shrink-0 items-center justify-center overflow-hidden rounded-[6px] bg-secondary max-[768px]:size-[65px] [&_img]:size-full [&_img]:object-cover">
        {resource.cover ? (
          <img src={resource.cover} alt="" loading="lazy" referrerPolicy="no-referrer" />
        ) : (
          <Disc3 className="size-7 text-content-muted" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        {href ? (
          <Link href={href} scroll={false}>
            <strong className={resourceTitleClass}>{resource.name}</strong>
          </Link>
        ) : (
          <strong className={resourceTitleClass}>{resource.name}</strong>
        )}
        {resource.subtitle && (
          <p className={resourceMetaClass + " truncate"}>{resource.subtitle}</p>
        )}
        <p className={resourceMetaClass}>
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
          className="mr-1 flex size-[38px] shrink-0 items-center justify-center rounded-full border border-foreground hover:border-primary hover:text-primary [&_svg]:size-4"
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
          className={socialIconButtonClass + " max-[768px]:hidden"}
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
