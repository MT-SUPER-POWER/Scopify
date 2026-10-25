import type { CompanionLyricSnapshot } from "@/types/desktopCompanion";
import type { DynamicIslandContent } from "@/types/dynamicIsland";
import type { TaskbarLyricItem } from "@/types/taskbarLyric";

const APP_NAME = "Scopify";

function formatTrack(snapshot: CompanionLyricSnapshot) {
  const track = snapshot.track;
  if (!track) return { title: APP_NAME, artists: "" };
  return { title: track.title, artists: track.artistNames.join(" / ") };
}

/** 间奏保持空白；正常歌词可带翻译副行，无歌词资源时才回退到歌曲信息。 */
export function buildDynamicIslandContent(
  snapshot: CompanionLyricSnapshot,
  showTranslation: boolean,
): DynamicIslandContent {
  const line = snapshot.activeLine;
  if (
    snapshot.isInterlude ||
    (line && (!line.fullText.trim() || /^(?:\.{3,}|[…⋯]+)$/u.test(line.fullText.trim())))
  ) {
    return { key: "interlude", main: "", sub: "" };
  }
  if (line) {
    return {
      key: `line-${snapshot.index}-${line.startTime}`,
      main: line.fullText,
      sub: showTranslation ? (line.translation ?? "") : "",
      progressLine: line,
    };
  }
  const { title, artists } = formatTrack(snapshot);
  const main = artists ? `${title} - ${artists}` : title;
  return { key: `meta-${main}`, main, sub: "" };
}

/**
 * 任务栏歌词的主副两行：主行是当前句；副行优先翻译，其次下一句。
 * 无歌词时主行歌名、副行歌手。
 */
export function buildTaskbarLyricItems(
  snapshot: CompanionLyricSnapshot,
  options: { doubleLine: boolean; showTranslation: boolean },
): TaskbarLyricItem[] {
  const line = snapshot.activeLine;
  if (line && !snapshot.isInterlude) {
    const items: TaskbarLyricItem[] = [
      {
        key: `line-${snapshot.index}-${line.startTime}`,
        role: "primary",
        text: line.fullText,
        progressLine: line,
      },
    ];
    if (!options.doubleLine) return items;
    const translation = options.showTranslation ? line.translation : "";
    if (translation) {
      items.push({ key: `translation-${snapshot.index}`, role: "secondary", text: translation });
    } else if (snapshot.nextLine) {
      items.push({
        key: `line-${snapshot.index + 1}-${snapshot.nextLine.startTime}`,
        role: "secondary",
        text: snapshot.nextLine.fullText,
      });
    }
    return items;
  }
  const { title, artists } = formatTrack(snapshot);
  const items: TaskbarLyricItem[] = [{ key: `meta-title-${title}`, role: "primary", text: title }];
  if (options.doubleLine && artists) {
    items.push({ key: `meta-artist-${artists}`, role: "secondary", text: artists });
  }
  return items;
}
