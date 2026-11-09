"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Share2 } from "lucide-react";
import { MvInteractions, MV_ACTION_BTN, MV_IDLE_BTN } from "./MvInteractions";
import { MvChannel } from "@/components/mv/MvChannel";
import { CapabilityGate } from "@/components/provider/CapabilityGate";
import { cn, formatPlayCount } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useI18nStore } from "@/store/module/i18n";
import type { MvInfoProps } from "@/types/mv/components";

/**
 * 播放器下方的信息区（参考 YouTube 观看页）：标题；艺人行与点赞/收藏/复制链接；
 * 播放量、发布时间与简介合在一个可展开的卡片里。点赞与收藏是平台账号功能（mv.interact）。
 */
export function MvInfo({ detail }: MvInfoProps) {
  const { t } = useTranslation(),
    locale = useI18nStore((state) => state.locale);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const description = detail.description;
  const publishedDate = detail.publishedAt === null ? null : new Date(detail.publishedAt);
  const publishedLabel =
    publishedDate && !Number.isNaN(publishedDate.getTime())
      ? publishedDate.toLocaleDateString(locale, { dateStyle: "long" })
      : "";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/mv?id=${detail.ref.id}`);
      toast.success(t("mv.toast.linkCopied"));
    } catch {
      toast.error(t("common.message.requestFailed", { message: "" }));
    }
  };

  return (
    <section className="mt-4">
      <h1 className="text-xl leading-snug font-bold text-content md:text-2xl">{detail.title}</h1>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-6 gap-y-3">
          {detail.artists.map((artist) => (
            <MvChannel key={artist.ref.id} artist={{ id: artist.ref.id, name: artist.name }} />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CapabilityGate requires="mv.interact">
            <MvInteractions mvid={detail.ref.id} />
          </CapabilityGate>
          <button
            type="button"
            onClick={() => void copyLink()}
            className={cn(MV_ACTION_BTN, MV_IDLE_BTN)}
          >
            <Share2 className="size-4" />
            {t("mv.action.share")}
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-content/10 p-3 text-sm">
        <p className="font-semibold text-content">
          {[
            detail.playCount
              ? t("mv.meta.views", {
                  count: detail.playCount,
                  replace: { count: formatPlayCount(detail.playCount) },
                })
              : "",
            publishedLabel,
          ]
            .filter(Boolean)
            .join("  ")}
        </p>
        {description && (
          <>
            <p
              className={cn(
                "mt-1 leading-6 whitespace-pre-line text-content/90",
                !isDescExpanded && "line-clamp-2",
              )}
            >
              {description}
            </p>
            <button
              type="button"
              onClick={() => setIsDescExpanded((value) => !value)}
              className="mt-1 font-semibold text-content hover:underline"
            >
              {t(isDescExpanded ? "common.action.showLess" : "common.action.showAll")}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
