import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "bun:test";

import { PlaybackProgressBar } from "@/components/PlayBar/PlaybackProgressBar";
import { FoliaPlaybackProgressBar } from "@/components/desktopWallpaper/FoliaPlaybackProgressBar";

function findElement(
  node: ReactNode,
  predicate: (element: ReactElement) => boolean,
): ReactElement | null {
  if (!isValidElement(node)) return null;
  if (predicate(node)) return node;

  const children = (node.props as { children?: ReactNode }).children;
  for (const child of Children.toArray(children)) {
    const match = findElement(child, predicate);
    if (match) return match;
  }
  return null;
}

describe("Folia playback progress bar", () => {
  test("reuses the shared progress bar and emits dragged seek positions", () => {
    const seekPositions: number[] = [];
    const control = FoliaPlaybackProgressBar({
      ariaLabel: "播放进度",
      durationMs: 210_000,
      onSeek: (positionMs) => seekPositions.push(positionMs),
      positionMs: 65_000,
    });

    const markup = renderToStaticMarkup(control);
    expect(markup).toContain(">1:05<");
    expect(markup).toContain(">3:30<");

    const progressBar = findElement(control, (element) => element.type === PlaybackProgressBar);
    expect(progressBar).not.toBeNull();
    const progressBarProps = progressBar?.props as {
      ariaLabel: string;
      onSeek(positionMs: number, isCommit: boolean): void;
      variant: string;
    };
    expect(progressBarProps.ariaLabel).toBe("播放进度");
    expect(progressBarProps.variant).toBe("folia");

    progressBarProps.onSeek(90_000, false);
    progressBarProps.onSeek(95_000, true);
    expect(seekPositions).toEqual([90_000, 95_000]);
  });
});
