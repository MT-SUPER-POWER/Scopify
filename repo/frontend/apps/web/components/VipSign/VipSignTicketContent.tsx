"use client";

import { useTranslation } from "react-i18next";

import type { VipSignTicketContentProps } from "@/types/vipSign/components";

export function VipSignTicketContent({ todayRecord }: VipSignTicketContentProps) {
  const { t } = useTranslation();
  const name = todayRecord?.songInfo?.songName ?? t("vipSign.recommendedSong");
  const split = name.match(/^(.*?)\s*(\([^()]+\)|（[^（）]+）)$/);
  return (
    <div className="scrollbar-thin flex h-full max-h-[min(680px,calc(100dvh-100px))] scrollbar-thumb-[#28463755] flex-col gap-[25px] overflow-y-auto px-[38px] pt-8 pb-7 max-[650px]:max-h-none max-[650px]:gap-5 max-[650px]:px-5 max-[650px]:py-[25px] [@media(max-height:650px)]:max-h-none">
      <header className="flex items-center gap-3 font-(family-name:--ticket-serif) max-[650px]:flex-wrap max-[650px]:gap-2">
        <span className="grid size-[35px] shrink-0 place-items-center rounded-full bg-[#1b4335] text-2xl text-[#f9f2df] max-[650px]:size-[26px] max-[650px]:text-lg">
          N
        </span>
        <span className="text-[15px] font-bold tracking-[0.16em] max-[650px]:text-[11px]">
          SCOPIFY
        </span>
        <span className="border-l border-[#28463755] pl-3 text-[10px] tracking-widest max-[650px]:hidden">
          DAILY MUSIC
        </span>
        <span className="ml-auto text-[15px] whitespace-nowrap max-[650px]:m-0 max-[650px]:w-full max-[650px]:text-xs">
          {t("vipSign.ticketTitle")}
        </span>
      </header>
      <div className="mt-[9px]">
        <h2 className="leading-1.08 font-(family-name:--ticket-serif) text-[clamp(30px,3.5vw,52px)] font-semibold tracking-[-0.045em] text-balance wrap-anywhere max-[650px]:text-[28px]">
          {split?.[1] || name}
        </h2>
        {split && (
          <p className="leading-1.3 mt-2.5 font-(family-name:--ticket-serif) text-[clamp(17px,1.7vw,24px)] wrap-anywhere max-[650px]:text-[15px]">
            {split[2]}
          </p>
        )}
        <p className="mt-4 text-[15px] max-[650px]:text-xs">{todayRecord?.songInfo?.artistName}</p>
      </div>
      <blockquote className="m-0 flex flex-1 flex-col justify-center border-t border-[#28463740] pt-[22px] pb-3 font-(family-name:--ticket-serif) text-[#183b30] max-[650px]:pt-[18px]">
        <div className="flex items-start gap-3 max-[650px]:gap-[7px]">
          <span
            className="shrink-0 font-[Georgia,serif] text-5xl leading-none text-[#728373] max-[650px]:text-[34px]"
            aria-hidden="true"
          >
            “
          </span>
          <p className="leading-1.85 max-[650px]:leading-1.8 pt-1 text-[21px] tracking-[0.035em] text-pretty wrap-anywhere whitespace-pre-line max-[650px]:text-[17px]">
            {todayRecord?.wishWords ?? t("vipSign.recommendedSong")}
          </p>
        </div>
        {todayRecord?.wishUserNickname && (
          <cite className="leading-1.6 mt-3.5 ml-9 block text-right font-[inherit] text-[13px] wrap-anywhere text-[#526153] not-italic">
            {t("vipSign.commentFrom", { nickname: todayRecord.wishUserNickname })}
          </cite>
        )}
      </blockquote>
      <footer className="mt-2 flex flex-wrap items-center gap-3 font-(family-name:--ticket-serif) text-xs">
        <span>
          {t("vipSign.monthlyCheckIn")}{" "}
          <strong className="px-1.5 font-(family-name:--ticket-mono) text-[19px] font-normal">
            {String(todayRecord?.monthCheckInTotalDay ?? 0).padStart(2, "0")}
          </strong>{" "}
          {t("vipSign.days")}
        </span>
        <span className="h-px min-w-5 flex-1 bg-[#28463755] max-[650px]:hidden" />
        {todayRecord?.recordId != null && (
          <span className="font-(family-name:--ticket-mono) text-[10px] wrap-anywhere">
            No. {todayRecord.recordId}
          </span>
        )}
      </footer>
    </div>
  );
}
