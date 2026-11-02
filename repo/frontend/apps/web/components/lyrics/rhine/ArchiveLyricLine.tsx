"use client";

import { memo, useMemo } from "react";
import { motion, useTransform } from "framer-motion";
import { archiveDisplayWords, archiveWordProgress } from "@/lib/lyrics/rhine/archiveLyrics";
import type { ArchiveLyricLineProps, ArchiveWordProps } from "@/types/lyrics/archive";

const lyricButtonClass = "block w-full text-left whitespace-pre-wrap";

const ArchiveWord = memo(function ArchiveWord({ word, currentTime }: ArchiveWordProps) {
  const backgroundImage = useTransform(currentTime, (time) => {
    const position = archiveWordProgress(word, time) * 100;
    return `linear-gradient(90deg, var(--archive-ink) ${position}%, var(--archive-unsung) ${position}%)`;
  });
  return (
    <motion.span className="bg-clip-text text-transparent" style={{ backgroundImage }}>
      {word.text}
    </motion.span>
  );
});

export const ArchiveLyricLine = memo(function ArchiveLyricLine({
  line,
  currentTime,
  onSeek,
  seekLabel,
}: ArchiveLyricLineProps) {
  const words = useMemo(() => archiveDisplayWords(line), [line]);
  const content = (
    <span aria-hidden="true">
      {words.map((word, index) => (
        <ArchiveWord key={`${index}:${word.startTime}`} word={word} currentTime={currentTime} />
      ))}
    </span>
  );

  if (onSeek) {
    return (
      <button
        type="button"
        className={lyricButtonClass}
        aria-label={`${seekLabel}: ${line.fullText}`}
        onClick={() => onSeek(line.startTime)}
      >
        {content}
      </button>
    );
  }

  return <span className={lyricButtonClass}>{content}</span>;
});
