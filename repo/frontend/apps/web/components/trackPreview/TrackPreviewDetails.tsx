"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { MvChannel } from "@/components/mv/MvChannel";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { resolveCoverUrl } from "@/lib/music/resolveCoverUrl";
import type { TrackPreviewDetailsProps } from "@/types/player/trackPreviewComponents";

export function TrackPreviewDetails({
  song,
  title,
  tags,
  direction,
  progress,
  onClose,
}: TrackPreviewDetailsProps) {
  const artworkUrl = resolveCoverUrl(song.al?.picUrl, song.al?.coverUrl);
  const mainArtist = song.ar?.find((artist) => artist.id);
  const year = song.publishTime > 0 ? new Date(song.publishTime).getFullYear() : null;
  const chips = [...tags.map((tag) => `#${tag}`), ...(year ? [String(year)] : [])];
  return (
    <div className="flex min-w-0 flex-col">
      <p className="truncate text-2xl font-bold">{title}</p>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={song.id}
          initial={{ opacity: 0, y: direction * 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: direction * -24 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="flex flex-1 flex-col justify-center gap-3"
        >
          <h2 className="line-clamp-3 text-5xl leading-tight font-black break-words">
            {song.name}
          </h2>
          <p className="truncate text-base text-content/70">
            {song.ar?.map((artist) => artist.name).join(", ")}
          </p>
          <div className="mt-4 flex items-center gap-4">
            <span className="relative size-14 shrink-0 overflow-hidden rounded bg-content/10">
              {artworkUrl && (
                <Image
                  fill
                  sizes="56px"
                  src={getSizedImageUrl(artworkUrl, 120)}
                  alt=""
                  className="object-cover"
                />
              )}
            </span>
            <span className="h-1 w-full max-w-60 overflow-hidden rounded-full bg-content/20">
              <span
                className="block h-full rounded-full bg-content transition-[width] duration-200 ease-linear"
                style={{ width: `${progress * 100}%` }}
              />
            </span>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="flex flex-col gap-4">
        {mainArtist && <MvChannel key={mainArtist.id} artist={mainArtist} />}
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {chips.map((chip) => (
              <span
                key={chip}
                className="rounded-full bg-content/10 px-3 py-1 text-sm font-bold text-content"
              >
                {chip}
              </span>
            ))}
          </div>
        )}
        {song.al?.id ? (
          <Link
            href={`/album?id=${song.al.id}`}
            scroll={false}
            onClick={onClose}
            className="w-fit truncate text-sm text-content/60 hover:text-content hover:underline"
          >
            {song.al.name}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
