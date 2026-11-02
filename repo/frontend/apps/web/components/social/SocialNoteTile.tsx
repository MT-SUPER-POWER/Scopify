"use client";

import { Heart, Images, LoaderCircle, Music2, Play, Repeat2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useSocialEventActions } from "@/hooks/social/useSocialActions";
import { useSocialPlayback } from "@/hooks/social/useSocialPlayback";
import { useSocialPostModal } from "@/hooks/social/useSocialPostModal";
import { useRequireLoginAction } from "@/hooks/auth/useRequireLoginAction";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { useTranslation } from "react-i18next";
import { useI18nStore } from "@/store/module/i18n";
import type { SocialNoteTileProps, SocialResourceProps } from "@/types/social/components";
import { SocialAuthor, SocialAvatar } from "./SocialPrimitives";
import { SocialInlineText } from "./SocialInlineText";

const tileMediaClass = "relative block overflow-hidden rounded-[14px] bg-foreground/6";
const tileImageClass =
  "block h-auto max-h-[420px] min-h-[120px] w-full object-cover transition-transform duration-400 ease-[ease] group-hover/tile:scale-[1.03]";
/** 作者与来源用「·」分隔；个人主页动态栏会隐藏头像和作者名，只留来源。 */
const tileAuthorClass =
  "flex min-w-0 flex-1 items-center gap-1.5 *:inline-flex *:min-w-0 *:items-center *:gap-[3px] *:overflow-hidden *:text-ellipsis *:whitespace-nowrap [&_a:hover]:text-foreground [&_svg]:size-3 [&>:first-child]:max-w-[60%] [&>:first-child]:shrink-0 [&>:first-child]:text-[12px] [&>:first-child]:font-medium [&>:not(:first-child)]:before:mr-[3px] [&>:not(:first-child)]:before:content-['·']";

/**
 * 瀑布流中的一条动态：封面（图片 / 歌曲封面 / 文字卡）+ 标题 + 作者与点赞。
 * 不加卡片底色，直接坐在页面面板上，避免与面板产生色差；完整内容在浮层中查看。
 */
export function SocialNoteTile({ event, source }: SocialNoteTileProps) {
  const { t } = useTranslation(),
    locale = useI18nStore((state) => state.locale);
  const requireLogin = useRequireLoginAction();
  const actions = useSocialEventActions(event);
  // 点击在当前页打开动态浮层，而不是跳到独立详情页
  const href = useSocialPostModal().hrefFor(event);
  // 纯转发没有自己的配图和资源时，用原动态的内容做封面
  const content = event.pictures.length || event.resource || !event.forward ? event : event.forward;
  const picture = content.pictures[0];
  const resource = content.resource;
  const caption = event.title || event.text || content.title || content.text;
  const likes = event.likes
    ? new Intl.NumberFormat(locale, { notation: "compact" }).format(event.likes)
    : "";

  return (
    <article className="group/tile min-w-0">
      {picture ? (
        <Link href={href} scroll={false} className={tileMediaClass}>
          <img
            src={picture}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className={tileImageClass}
          />
          {content.pictures.length > 1 && (
            <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white [&_svg]:size-3">
              <Images aria-hidden="true" />
              {content.pictures.length}
            </span>
          )}
        </Link>
      ) : resource?.cover ? (
        <Link href={href} scroll={false} className={tileMediaClass} data-square="true">
          <img
            src={resource.cover}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className={tileImageClass + " aspect-square"}
          />
        </Link>
      ) : (
        // 没有图片的动态：以文字本身做封面
        <Link
          href={href}
          scroll={false}
          className="flex min-h-[150px] items-end rounded-[14px] bg-[color-mix(in_srgb,var(--primary)_10%,var(--card))] p-[18px] transition-[background-color] duration-200 ease-[ease] hover:bg-[color-mix(in_srgb,var(--primary)_16%,var(--card))]"
        >
          <p className="leading-1.7 line-clamp-7 text-[15px] font-semibold wrap-anywhere whitespace-pre-line">
            <SocialInlineText text={caption || t("social.unknownPost")} />
          </p>
        </Link>
      )}

      <div className="px-0.5 pt-2.5">
        {(picture || resource?.cover) && caption && (
          <Link
            href={href}
            scroll={false}
            className="leading-1.55 line-clamp-2 text-[14px] font-semibold wrap-anywhere text-foreground"
          >
            <SocialInlineText text={caption} />
          </Link>
        )}
        {resource && <SocialResourceChip resource={resource} />}
        <footer
          data-slot="social-tile-meta"
          className="mt-2.5 flex items-center gap-2 text-[12px] text-muted-foreground"
        >
          <SocialAvatar user={event.user} className="size-[22px] max-[768px]:size-[22px]" />
          <span data-slot="social-tile-author" className={tileAuthorClass}>
            <SocialAuthor user={event.user} />
            {source ? (
              <Link href={source.href} scroll={false} title={source.name}>
                {source.name}
              </Link>
            ) : (
              event.forward && (
                <span>
                  <Repeat2 aria-hidden="true" />
                  {t("social.forward")}
                </span>
              )
            )}
          </span>
          <button
            type="button"
            className="inline-flex shrink-0 items-center gap-1 p-1 text-[12px] text-muted-foreground hover:text-primary data-[active=true]:text-primary [&_svg]:size-[15px] data-[active=true]:[&_svg]:fill-current"
            data-active={event.liked}
            aria-pressed={event.liked}
            disabled={actions.liking || !event.threadId}
            aria-label={t(event.liked ? "social.unlike" : "social.like") + " " + event.likes}
            onClick={() => void requireLogin(() => actions.like.mutate(!event.liked))}
          >
            <Heart aria-hidden="true" />
            {likes && <span>{likes}</span>}
          </button>
        </footer>
      </div>
    </article>
  );
}

/** 动态里分享的歌曲 / 歌单：一行胶囊，可直接播放 */
function SocialResourceChip({ resource }: SocialResourceProps) {
  const { t } = useTranslation();
  const { play, pending, playable } = useSocialPlayback(resource);
  const cover = getSizedImageUrl(resource.cover || resource.song?.al.picUrl, 48);
  const [failedCover, setFailedCover] = useState<string | null>(null);
  const label = resource.subtitle ? `${resource.name} · ${resource.subtitle}` : resource.name;
  return (
    <div className="mt-2 flex min-h-[30px] items-center gap-1.5 rounded-full bg-foreground/6 py-[3px] pr-[3px] pl-2.5 text-[12px] text-muted-foreground">
      {cover && cover !== failedCover ? (
        <img
          src={cover}
          alt=""
          width={20}
          height={20}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="size-5 shrink-0 rounded-[3px] object-cover"
          onError={() => setFailedCover(cover)}
        />
      ) : (
        <Music2 aria-hidden="true" className="size-[13px] shrink-0" />
      )}
      <span title={label} className="min-w-0 flex-1 truncate">
        {label}
      </span>
      {playable && (
        <button
          type="button"
          className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-card [&_svg]:size-[11px]"
          disabled={pending}
          aria-label={t("social.play") + " " + resource.name}
          onClick={() => void play()}
        >
          {pending ? <LoaderCircle className="animate-spin" /> : <Play className="fill-current" />}
        </button>
      )}
    </div>
  );
}
