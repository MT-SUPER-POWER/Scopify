import { describe, expect, it } from "bun:test";
import {
  resolvePendoloSubtitleTracks,
  sumPendoloSubtitleTrackHeights,
} from "@/components/lyrics/folia/src/components/visualizer/pendolo/pendoloSubtitleTracks";

// 时计副字幕行（Folia 5809e8e8、5b2bbb6d）：预留高度与绘制共用同一套行规格
const line = { translation: "你的名字", romanization: "kimi no na wa" };

describe("resolvePendoloSubtitleTracks", () => {
  it("stacks a smaller, quieter translation under the romanization in 'both'", () => {
    const [lead, second] = resolvePendoloSubtitleTracks(line, {
      mode: "both",
      hidden: false,
      focal: true,
      fontScale: 1,
    });
    expect(lead).toMatchObject({ role: "romanization", fontPx: 16, opacityFactor: 1, gapEm: 0.25 });
    expect(second).toMatchObject({ role: "translation", fontPx: 14, opacityFactor: 0.82 });
    expect(lead.lineHeightPx).toBe(24);
  });

  it("follows the romanization-only mode and the hidden switch", () => {
    const options = { hidden: false, focal: false, fontScale: 1 };
    expect(
      resolvePendoloSubtitleTracks(line, { ...options, mode: "romanization" }).map((t) => t.text),
    ).toEqual(["kimi no na wa"]);
    expect(resolvePendoloSubtitleTracks(line, { ...options, mode: "both", hidden: true })).toEqual(
      [],
    );
  });

  it("reserves each row's text height plus its own gap", () => {
    const tracks = resolvePendoloSubtitleTracks(line, {
      mode: "both",
      hidden: false,
      focal: true,
      fontScale: 1,
    });
    expect(sumPendoloSubtitleTrackHeights(tracks, () => 10)).toBeCloseTo(10 + 4 + 10 + 3.5, 6);
  });
});
