import type { CompanionLyricSnapshot } from "@/types/desktopCompanion";
import type { DynamicIslandContent } from "@/types/dynamicIsland";

const APP_NAME = "Scopify";

function formatTrack(snapshot: CompanionLyricSnapshot) {
  const track = snapshot.track;
  if (!track) return { title: APP_NAME, artists: "" };
  return { title: track.title, artists: track.artistNames.join(" / ") };
}

/** 有歌词时显示当前句（可带翻译副行）；间奏或无歌词时显示“歌名 - 歌手”。 */
export function buildDynamicIslandContent(
  snapshot: CompanionLyricSnapshot,
  showTranslation: boolean,
): DynamicIslandContent {
  const line = snapshot.activeLine;
  if (line && !snapshot.isInterlude) {
    return {
      key: `line-${snapshot.index}-${line.startTime}`,
      main: line.fullText,
      sub: showTranslation ? (line.translation ?? "") : "",
      progress: snapshot.fillProgress,
    };
  }
  const { title, artists } = formatTrack(snapshot);
  const main = artists ? `${title} - ${artists}` : title;
  return { key: `meta-${main}`, main, sub: "" };
}
