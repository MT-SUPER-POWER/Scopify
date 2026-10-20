import { getImageProps } from "next/image";

import { CURVED_CARD_LIFT, placeOnCylinder } from "@/lib/marketing/curved-track";
import type { LandingCurvedTrackLayout, LandingDayMoment } from "@/types/marketing";

interface LandingDayCardProps {
  /** 卡片中心在曲面上的弧长坐标。 */
  center: number;
  index: number;
  layout: LandingCurvedTrackLayout;
  moment: LandingDayMoment;
  /** 接近该章节后才开始加载截图。 */
  showImage: boolean;
}

const CAPTION_GAP = 26;

/**
 * 曲面屏上的一个场景：截图被切成竖向窄条逐条贴到圆柱面上，
 * 所以单张卡片本身也是弯的；下方说明文字贴在同一曲面的卡片中心处。
 */
export function LandingDayCard({ center, index, layout, moment, showImage }: LandingDayCardProps) {
  const { cardHeight, cardWidth, radius, stripCount } = layout;
  const stripWidth = cardWidth / stripCount;
  const { src: image } = moment.screenshot;
  const coverScale = Math.max(cardWidth / image.width, cardHeight / image.height);
  const backgroundSize = `${image.width * coverScale}px ${image.height * coverScale}px`;
  const {
    props: { src: imageUrl },
  } = getImageProps({ alt: "", src: image, width: 960 });
  const cardTop = -cardHeight / 2 - CURVED_CARD_LIFT;

  return (
    <>
      {Array.from({ length: stripCount }, (_, stripIndex) => {
        const arc = center - cardWidth / 2 + (stripIndex + 0.5) * stripWidth;
        const isFirst = stripIndex === 0;
        const isLast = stripIndex === stripCount - 1;
        // 相邻窄条多盖 1px，避免透视后出现发丝缝。
        const width = isLast ? stripWidth : stripWidth + 1;
        return (
          <div
            key={stripIndex}
            data-arc={arc}
            role={isFirst ? "img" : undefined}
            aria-label={isFirst ? moment.screenshot.alt : undefined}
            aria-hidden={isFirst ? undefined : true}
            className={`absolute top-1/2 left-1/2 border-y border-white/10 bg-[#0b0d14] bg-no-repeat backface-hidden ${
              isFirst ? "rounded-l-2xl border-l" : ""
            } ${isLast ? "rounded-r-2xl border-r" : ""}`}
            style={{
              backgroundImage: showImage ? `url(${imageUrl})` : undefined,
              backgroundPosition: `${-stripIndex * stripWidth}px 0px`,
              backgroundSize,
              height: cardHeight,
              marginLeft: -width / 2,
              marginTop: cardTop,
              transform: placeOnCylinder(arc, radius).transform,
              width,
            }}
          />
        );
      })}

      <div
        data-arc={center}
        data-arc-fade
        className="absolute top-1/2 left-1/2 flex items-baseline gap-5 backface-hidden"
        style={{
          marginLeft: -cardWidth / 2,
          marginTop: cardHeight / 2 - CURVED_CARD_LIFT + CAPTION_GAP,
          transform: placeOnCylinder(center, radius).transform,
          width: cardWidth,
        }}
      >
        <span className="font-mono text-xs text-white/40 tabular-nums">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0">
          <h3 className="landing-display flex items-center gap-3 text-2xl font-semibold text-white sm:text-3xl">
            {moment.scene}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-2.5 py-0.5 font-sans text-xs font-medium text-white/70">
              <span className="size-1.5 rounded-full bg-[#f0b878]" />
              {moment.feature}
            </span>
          </h3>
          <p className="mt-2 max-w-xl text-sm leading-7 text-white/60 sm:text-base">
            {moment.sentence}
          </p>
        </div>
      </div>
    </>
  );
}
