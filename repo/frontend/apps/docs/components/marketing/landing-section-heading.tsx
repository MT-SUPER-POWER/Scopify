import type { ReactNode } from "react";

interface LandingSectionHeadingProps {
  icon?: ReactNode;
  id: string;
  meta?: ReactNode;
  subtitle: string;
  title: string;
}

/** 听歌报告式的分区标题：大标题 + 一句情绪化副标题 + 右侧小号元信息。 */
export function LandingSectionHeading({
  icon,
  id,
  meta,
  subtitle,
  title,
}: LandingSectionHeadingProps) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h2
          id={id}
          className="landing-display text-[clamp(1.9rem,3.6vw,3.25rem)] leading-[1.12] font-medium tracking-[-0.04em] text-balance text-white"
        >
          {title}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/52 sm:text-base">{subtitle}</p>
      </div>
      {meta ? (
        <div className="flex shrink-0 items-center gap-2 text-xs font-medium text-white/48">
          {icon}
          <span>{meta}</span>
        </div>
      ) : null}
    </div>
  );
}
