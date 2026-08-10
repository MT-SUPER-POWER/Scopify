import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "bun:test";

import { DesktopPlaybackPlayerControls } from "@/components/desktopWallpaper/DesktopPlaybackPlayerControls";
import type { SongDetail } from "@/types/api/music";
import type { DesktopLyricTrack } from "@/types/desktopLyric";

function createSong(id: number, name: string): SongDetail {
  return {
    al: { id, name: `Album ${id}`, picUrl: "" },
    ar: [{ id, name: `Artist ${id}` }],
    dt: 180_000,
    fee: 0,
    id,
    name,
    publishTime: 0,
  };
}

function createPresentationTrack(id: number, title: string): DesktopLyricTrack {
  return {
    albumTitle: `Album ${id}`,
    artistNames: [`Artist ${id}`],
    durationMs: 180_000,
    id,
    title,
  };
}

describe("desktop playback controller track synchronization", () => {
  test("never lets a stale wallpaper presentation override the authoritative current song", () => {
    const markup = renderToStaticMarkup(
      <DesktopPlaybackPlayerControls
        activeLyric={null}
        currentSong={createSong(2, "New song")}
        desktopControl={null}
        durationMs={180_000}
        isPlaying
        onNext={() => undefined}
        onPrevious={() => undefined}
        onSeek={() => undefined}
        onTogglePlaying={() => undefined}
        onVolumeChange={() => undefined}
        positionMs={15_000}
        track={createPresentationTrack(1, "Stale song")}
        volume={80}
      />,
    );

    expect(markup).toContain("New song");
    expect(markup).not.toContain("Stale song");
  });
});
