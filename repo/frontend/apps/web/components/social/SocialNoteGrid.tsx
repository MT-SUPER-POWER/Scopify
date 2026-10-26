"use client";

import { useMasonryColumns } from "@/hooks/ui/useMasonryColumns";
import type { SocialNoteGridProps } from "@/types/components/social";
import type { SocialEvent } from "@/types/social";
import { SocialNoteTile } from "./SocialNoteTile";
import s from "./Social.module.css";

const MIN_COLUMN_WIDTH = 220;
const COLUMN_GAP = 20;

/** 估算一条动态在列中的相对高度，用于把新条目放进当前最矮的一列 */
function estimateHeight(event: SocialEvent) {
  const content = event.pictures.length || event.resource || !event.forward ? event : event.forward;
  const media = content.pictures.length ? 1.25 : content.resource?.cover ? 1 : 0.7;
  return media + (content.resource ? 0.55 : 0.4);
}

/**
 * 动态瀑布流：按顺序把每条放进估算高度最矮的列。
 * 分页追加时前面的分配结果不变，已显示的卡片不会跳列。
 */
export function SocialNoteGrid({ items, getSource }: SocialNoteGridProps) {
  const { ref, count } = useMasonryColumns<HTMLDivElement>(MIN_COLUMN_WIDTH, COLUMN_GAP);
  const columns: SocialEvent[][] = Array.from({ length: count }, () => []);
  const heights = new Array<number>(count).fill(0);
  for (const event of items) {
    const target = heights.indexOf(Math.min(...heights));
    columns[target].push(event);
    heights[target] += estimateHeight(event);
  }
  return (
    <div ref={ref} className={s.noteGrid} style={{ gap: COLUMN_GAP }}>
      {columns.map((column, index) => (
        <div key={index} className={s.noteColumn}>
          {column.map((event) => (
            <SocialNoteTile key={event.id} event={event} source={getSource?.(event)} />
          ))}
        </div>
      ))}
    </div>
  );
}
