import type {
  SubtitleOverlayLayout,
  SubtitleOverlayRowSource,
} from "@/types/lyrics/folia/subtitleTrack";

export const DEFAULT_SUBTITLE_OVERLAY_LAYOUT: SubtitleOverlayLayout = "translation";
export const SUBTITLE_OVERLAY_FIRST_ROWS = ["current", "translation", "romanization"] as const;
export const SUBTITLE_OVERLAY_FOLLOW_ROWS = ["next", "translation", "romanization"] as const;

const ROWS_ONLY_SUFFIX = "|only";

export function subtitleOverlayPreviewsUpcoming(layout: SubtitleOverlayLayout): boolean {
  return !layout.endsWith(ROWS_ONLY_SUFFIX);
}

export function getSubtitleOverlayRows(layout: SubtitleOverlayLayout): SubtitleOverlayRowSource[] {
  const value = layout.replace(/\|only$/, "");
  return value === "none" ? [] : (value.split("+") as SubtitleOverlayRowSource[]);
}

export function parseSubtitleOverlayLayout(value: unknown): SubtitleOverlayLayout | null {
  if (typeof value !== "string") return null;
  const layout = value.replace(/\|only$/, "");
  if (layout === "none") return value as SubtitleOverlayLayout;
  const [first, ...rest] = layout.split("+");
  return (SUBTITLE_OVERLAY_FIRST_ROWS as readonly string[]).includes(first) &&
    rest.length <= 2 &&
    rest.every((row) => (SUBTITLE_OVERLAY_FOLLOW_ROWS as readonly string[]).includes(row))
    ? (value as SubtitleOverlayLayout)
    : null;
}

export function withSubtitleOverlayUpcomingPreview(
  layout: SubtitleOverlayLayout,
  enabled: boolean,
): SubtitleOverlayLayout {
  const rows = layout.replace(/\|only$/, "");
  return (enabled ? rows : `${rows}${ROWS_ONLY_SUFFIX}`) as SubtitleOverlayLayout;
}

function replaceRows(
  layout: SubtitleOverlayLayout,
  rows: SubtitleOverlayRowSource[],
): SubtitleOverlayLayout {
  const value = parseSubtitleOverlayLayout(rows.length === 0 ? "none" : rows.join("+"));
  return value
    ? withSubtitleOverlayUpcomingPreview(value, subtitleOverlayPreviewsUpcoming(layout))
    : layout;
}

export function withSubtitleOverlayRowCount(
  layout: SubtitleOverlayLayout,
  count: 0 | 1 | 2 | 3,
): SubtitleOverlayLayout {
  const rows = getSubtitleOverlayRows(layout);
  if (count === rows.length) return layout;
  if (count === 0) return replaceRows(layout, []);
  if (count === 1) {
    const alternate = rows.find((row) => row === "translation" || row === "romanization");
    return replaceRows(layout, [alternate ?? "current"]);
  }
  if (rows.length === 1) {
    if (rows[0] === "current") rows.push("next");
    else rows.unshift("current");
  }
  if (rows.length === 0) rows.push("current");
  while (rows.length < count) {
    const next = (["translation", "romanization", "next"] as const).find(
      (row) => !rows.includes(row),
    );
    rows.push(next ?? "next");
  }
  return replaceRows(layout, rows.slice(0, count));
}

export function withSubtitleOverlayRow(
  layout: SubtitleOverlayLayout,
  index: number,
  source: SubtitleOverlayRowSource,
): SubtitleOverlayLayout {
  const rows = getSubtitleOverlayRows(layout);
  if (index < 0 || index >= rows.length) return layout;
  rows[index] = source;
  if (index === 0) {
    for (let row = 1; row < rows.length; row += 1) {
      if (rows[row] === source) {
        const alternate = (["translation", "romanization"] as const).find(
          (value) => !rows.includes(value),
        );
        rows[row] = alternate ?? "next";
      }
    }
  }
  return replaceRows(layout, rows);
}
