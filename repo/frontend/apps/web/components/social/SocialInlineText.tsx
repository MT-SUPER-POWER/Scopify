import type { SocialInlineTextProps } from "@/types/components/social";
import s from "./Social.module.css";

/** 话题只做文本着色，暂不提供话题链接或独立点击行为。 */
export function SocialInlineText({ text }: SocialInlineTextProps) {
  return (
    <>
      {text.split(/(#[^#\n]+#)/g).map((part, index) =>
        /^#[^#\n]+#$/.test(part) ? (
          <span key={index} className={s.hashtag}>
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}
