"use client";

import { Heart, Images, LoaderCircle, Music2, Play, Repeat2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useSocialEventActions } from "@/hooks/social/useSocialActions";
import { useSocialPlayback } from "@/hooks/social/useSocialPlayback";
import { useSocialPostModal } from "@/hooks/social/useSocialPostModal";
import { useRequireLoginAction } from "@/lib/hooks/useRequireLoginAction";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { useI18n } from "@/store/module/i18n";
import type { SocialNoteTileProps, SocialResourceProps } from "@/types/components/social";
import { SocialAuthor, SocialAvatar } from "./SocialPrimitives";
import { SocialInlineText } from "./SocialInlineText";
import s from "./Social.module.css";

/**
 * 瀑布流中的一条动态：封面（图片 / 歌曲封面 / 文字卡）+ 标题 + 作者与点赞。
 * 不加卡片底色，直接坐在页面面板上，避免与面板产生色差；完整内容在浮层中查看。
 */
export function SocialNoteTile({ event, source }: SocialNoteTileProps) {
  const { t, locale } = useI18n();
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
    <article className={s.tile}>
      {picture ? (
        <Link href={href} scroll={false} className={s.tileMedia}>
          <img src={picture} alt="" loading="lazy" referrerPolicy="no-referrer" />
          {content.pictures.length > 1 && (
            <span className={s.tileBadge}>
              <Images aria-hidden="true" />
              {content.pictures.length}
            </span>
          )}
        </Link>
      ) : resource?.cover ? (
        <Link href={href} scroll={false} className={s.tileMedia} data-square="true">
          <img src={resource.cover} alt="" loading="lazy" referrerPolicy="no-referrer" />
        </Link>
      ) : (
        <Link href={href} scroll={false} className={s.tileQuote}>
          <p>
            <SocialInlineText text={caption || t("social.unknownPost")} />
          </p>
        </Link>
      )}

      <div className={s.tileBody}>
        {(picture || resource?.cover) && caption && (
          <Link href={href} scroll={false} className={s.tileCaption}>
            <SocialInlineText text={caption} />
          </Link>
        )}
        {resource && <SocialResourceChip resource={resource} />}
        <footer className={s.tileMeta}>
          <SocialAvatar user={event.user} className={s.tileAvatar} />
          <span className={s.tileAuthor}>
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
            className={s.tileLike}
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
  const { t } = useI18n();
  const { play, pending, playable } = useSocialPlayback(resource);
  const cover = getSizedImageUrl(resource.cover || resource.song?.al.picUrl, 48);
  const [failedCover, setFailedCover] = useState<string | null>(null);
  const label = resource.subtitle ? `${resource.name} · ${resource.subtitle}` : resource.name;
  return (
    <div className={s.tileResource}>
      {cover && cover !== failedCover ? (
        <img
          src={cover}
          alt=""
          width={20}
          height={20}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailedCover(cover)}
        />
      ) : (
        <Music2 aria-hidden="true" />
      )}
      <span title={label}>{label}</span>
      {playable && (
        <button
          type="button"
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
