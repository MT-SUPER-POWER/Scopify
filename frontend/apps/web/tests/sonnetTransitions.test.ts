import { describe, expect, test } from "bun:test";

import {
  IDLE_SONNET_TRANSITION_FRAME,
  resolveSonnetEnterTransitionFrame,
  resolveSonnetExitTransitionFrame,
  resolveSonnetShotTransitionFrame,
  resolveSonnetTransitionEffectFrame,
} from "@/components/lyrics/folia/src/components/visualizer/sonnet/sonnetTransitions";
import type {
  SonnetParagraph,
  SonnetShot,
  SonnetTransitionKind,
} from "@/components/lyrics/folia/src/components/visualizer/sonnet/types";

const paragraph = (kind: SonnetTransitionKind): SonnetParagraph => ({
  id: "paragraph",
  kind: "verse",
  boundary: "time-gap",
  startTime: 1,
  endTime: 4,
  lines: [],
  shots: [],
  transitionOut: { kind, startTime: 3.8, endTime: 4 },
});

const shot = (id: string, startTime: number, endTime: number): SonnetShot => ({
  id,
  kind: "editorial-column",
  startTime,
  endTime,
  lineIndices: [],
  cues: [],
  camera: { x: 0, y: 0, zoom: 1, rotation: 0 },
});

describe("Sonnet scene transitions", () => {
  test("uses idle frames when disabled and confines blur to its transition window", () => {
    expect(resolveSonnetExitTransitionFrame(paragraph("fast-blur"), 3.9, false, 42)).toBe(
      IDLE_SONNET_TRANSITION_FRAME,
    );
    expect(resolveSonnetExitTransitionFrame(paragraph("fast-blur"), 3.7, true, 42)).toBe(
      IDLE_SONNET_TRANSITION_FRAME,
    );
    const frame = resolveSonnetExitTransitionFrame(paragraph("fast-blur"), 3.9, true, 42);
    expect(frame.blur).toBeGreaterThan(0);
    expect(frame.alpha).toBeLessThan(1);
  });

  test("keeps glitch deterministic and camera-pull transitions seek-safe", () => {
    const first = resolveSonnetTransitionEffectFrame("mono-glitch", "exit", 0.55, 1234);
    const second = resolveSonnetTransitionEffectFrame("mono-glitch", "exit", 0.55, 1234);
    expect(first).toEqual(second);
    expect(first.glitch).toBeGreaterThan(0);
    expect(first.x).toBe(0);
    expect(first.y).toBe(0);

    const start = resolveSonnetEnterTransitionFrame("camera-pull", 0, 0.2, true, 7);
    const end = resolveSonnetEnterTransitionFrame("camera-pull", 0.2, 0.2, true, 7);
    expect(start.scale).toBeLessThan(1);
    expect(end).toEqual(IDLE_SONNET_TRANSITION_FRAME);
  });

  test("transitions both sides of every internal shot boundary", () => {
    const shots = [shot("first", 1, 2.8), shot("second", 3, 5)];
    expect(resolveSonnetShotTransitionFrame(shots, 0, 2.9, true, 99)).not.toEqual(
      IDLE_SONNET_TRANSITION_FRAME,
    );
    expect(resolveSonnetShotTransitionFrame(shots, 1, 3.05, true, 99)).not.toEqual(
      IDLE_SONNET_TRANSITION_FRAME,
    );
  });
});
