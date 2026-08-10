import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "bun:test";

import { DesktopPlaybackProgressControl } from "@/components/desktopWallpaper/DesktopPlaybackProgressControl";

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

describe("desktop playback progress control", () => {
  test("shows elapsed and total time and emits the dragged seek position", () => {
    const seekPositions: number[] = [];
    const control = DesktopPlaybackProgressControl({
      ariaLabel: "播放进度",
      durationMs: 210_000,
      onSeek: (positionMs) => seekPositions.push(positionMs),
      positionMs: 65_000,
    });

    const markup = renderToStaticMarkup(control);
    expect(markup).toContain(">1:05<");
    expect(markup).toContain(">3:30<");

    const input = findElement(control, (element) => element.type === "input");
    expect(input).not.toBeNull();
    const inputProps = input?.props as {
      "aria-label": string;
      max: number;
      onChange(event: { currentTarget: { value: string } }): void;
      value: number;
    };
    expect(inputProps["aria-label"]).toBe("播放进度");
    expect(inputProps.max).toBe(210_000);
    expect(inputProps.value).toBe(65_000);

    inputProps.onChange({ currentTarget: { value: "90000" } });
    expect(seekPositions).toEqual([90_000]);
  });
});
