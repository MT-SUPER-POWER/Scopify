import type * as THREE from "three";
import type { RhineRhythmStyle } from "@/types/rhineBackground";

export type Surface = THREE.MeshPhysicalMaterial;
export interface Palette { high: Surface; low?: Surface }
export interface OpticalSurface { color: string; roughness: number; opacity: number; order: number }
export interface Baseline {
  background: THREE.Color;
  fog?: THREE.Color;
  intensity: number;
  exposure: number;
  lights: { light: THREE.Light; intensity: number }[];
  floor?: { material: THREE.MeshStandardMaterial; color: THREE.Color };
}
export interface RhythmFrame { style: Record<RhineRhythmStyle, number> }
export interface RhineCell { row: number; lane: number; key: string; x: number; z: number; screenX: number }
export type RhineShowcasePhase = "rising" | "holding" | "returning";
export interface RhineShowcaseCard {
  cell: RhineCell;
  group: THREE.Group;
  lift: number;
  startLift: number;
  phase: RhineShowcasePhase;
  elapsed: number;
}
