import type * as THREE from "three";
import type { RhineRhythmStyle } from "@/types/lyrics/rhine/background";

export type Surface = THREE.MeshPhysicalMaterial;
export interface Palette {
  high: Surface;
  low?: Surface;
}
export interface OpticalSurface {
  color: string;
  roughness: number;
  opacity: number;
  order: number;
}
export interface Baseline {
  background: THREE.Color;
  fog?: THREE.Color;
  intensity: number;
  exposure: number;
  lights: { light: THREE.Light; intensity: number }[];
  floor?: { material: THREE.MeshStandardMaterial; color: THREE.Color };
}
export interface RhythmFrame {
  style: Record<RhineRhythmStyle, number>;
}
export interface RhineThemeCell {
  row: number;
  lane: number;
}
export interface RhineCell extends RhineThemeCell {
  key: string;
  x: number;
  z: number;
  screenX: number;
}
export type RhineShowcasePhase = "rising" | "holding" | "returning";
export interface RhineShowcaseCard {
  cell: RhineCell;
  group: THREE.Group;
  lift: number;
  startLift: number;
  phase: RhineShowcasePhase;
  elapsed: number;
}
export interface RhineGlowUniforms {
  rhineGlowPosition: { value: THREE.Vector3 };
  rhineGlowStrength: { value: number };
  rhineGlowColor: { value: THREE.Color };
}
export interface RhineFieldPulse {
  row: number;
  lane: number;
  time: number;
}
export interface RhineBeatFrame {
  /** Kick, snare and hat onset strengths this frame; 0 means no onset. */
  onsets: [number, number, number];
  /** Smoothed log-spaced spectrum columns, bass to treble, 0-1. */
  levels: Float32Array;
}
