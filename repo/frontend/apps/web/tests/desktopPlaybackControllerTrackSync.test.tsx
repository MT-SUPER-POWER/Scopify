import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "bun:test";

import type { PlaybackTrack } from "@scopify/desktop-contract";

import { DesktopPlaybackPlayerControls } from "@/components/desktopWallpaper/DesktopPlaybackPlayerControls";

function createProjectionTrack(id: number, title: string): PlaybackTrack {
  return {
    albumTitle: `Album ${id}`,
    artistNames: [`Artist ${id}`],
    id,
    title,
  };
}

describe("desktop playback controller track synchronization", () => {
  test("renders the authoritative projection track without a fallback store song", () => {
    const markup = renderToStaticMarkup(
      <DesktopPlaybackPlayerControls
        activeLyric={null}
        currentSong={null}
        desktopControl={null}
        durationMs={180_000}
        isPlaying
        onNext={() => undefined}
        onPrevious={() => undefined}
        onSeek={() => undefined}
        onTogglePlaying={() => undefined}
        onVolumeChange={() => undefined}
        positionMs={15_000}
        track={createProjectionTrack(2, "New song")}
        volume={80}
      />,
    );

    expect(markup).toContain("New song");
    expect(markup).toContain("Artist 2");
  });
});
