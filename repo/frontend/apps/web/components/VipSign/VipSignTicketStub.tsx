"use client";

import { Play } from "lucide-react";
import Image from "next/image";
import { useTranslation } from "react-i18next";

import type { VipSignTicketStubProps } from "@/types/vipSign/components";

export function VipSignTicketStub({ todayRecord, onPlay, isPlaying }: VipSignTicketStubProps) {
  const { t } = useTranslation();
  const date = new Date(todayRecord?.time ?? Date.now());
  const song = todayRecord?.songInfo;
  return (
    <div className="relative z-1 flex flex-col items-center gap-2 px-[26px] pt-[30px] max-[650px]:px-3.5 max-[650px]:pt-[26px] max-[650px]:pb-2">
      <span className="font-(family-name:--ticket-serif) text-xs tracking-[0.12em] whitespace-nowrap max-[650px]:text-[8px] max-[650px]:tracking-normal">
        ✦ &nbsp; ADMIT ONE &nbsp; ✦
      </span>
      <time
        className="leading-1.1 mt-1 font-(family-name:--ticket-mono) text-[clamp(26px,3vw,40px)] max-[650px]:text-[25px]"
        dateTime={`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`}
      >
        {String(date.getMonth() + 1).padStart(2, "0")}.{String(date.getDate()).padStart(2, "0")}
      </time>
      <span className="font-(family-name:--ticket-mono) text-xs tracking-[0.2em]">
        {date.getFullYear()}
      </span>
      <button
        type="button"
        className="group relative mt-2 aspect-square w-full max-w-40 cursor-pointer overflow-hidden rounded bg-[#e8ddc5] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#73977d] disabled:cursor-default"
        onClick={onPlay}
        disabled={!song?.songId || isPlaying}
        aria-label={t("contextMenu.play")}
      >
        {song?.cover && (
          <Image
            src={song.cover}
            alt={song.songName}
            width={180}
            height={180}
            draggable={false}
            className="size-full object-cover"
          />
        )}
        <span className="absolute inset-0 grid place-items-center bg-[#142a2466] text-white opacity-0 transition-opacity duration-160 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none">
          <Play size={22} fill="currentColor" />
        </span>
      </button>
      <a
        className="mt-1.5 flex flex-col items-center gap-1.5 text-center text-[11px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#73977d]"
        href="https://music.163.com/m/header"
        target="_blank"
        rel="noreferrer"
        title={t("vipSign.qrHint")}
      >
        <Image
          width={60}
          height={60}
          draggable={false}
          className="border-3 border-white"
          src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://music.163.com/m/header"
          alt={t("vipSign.qrAlt")}
        />
        <span>{t("vipSign.memberCenter")}</span>
      </a>
    </div>
  );
}
