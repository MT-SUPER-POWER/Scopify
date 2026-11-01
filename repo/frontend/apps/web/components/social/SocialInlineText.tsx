import type { SocialInlineTextProps } from "@/types/social/components";

/** 话题只做文本着色，暂不提供话题链接或独立点击行为。 */
export function SocialInlineText({ text }: SocialInlineTextProps) {
  return (
    <>
      {text.split(/(#[^#\n]+#)/g).map((part, index) =>
        /^#[^#\n]+#$/.test(part) ? (
          <span key={index} className="text-[#c7daef]">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}
