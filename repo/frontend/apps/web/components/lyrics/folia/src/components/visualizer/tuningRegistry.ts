import type {
  CappellaTuning,
  CadenzaTuning,
  ClassicTuning,
  CladdaghTuning,
  DioramaTuning,
  FumeTuning,
  MonetTuning,
  PartitaTuning,
  PendoloTuning,
  SonnetTuning,
  TiltTuning,
  VisualizerMode,
} from "../../types";
import type { VisualizerSharedProps } from "./definition";
import cadenzaTuning from "./cadenza/tuning";
import cappellaTuning from "./cappella/tuning";
import claddaghTuning from "./claddagh/tuning";
import classicTuning from "./classic/tuning";
import dioramaTuning from "./diorama/tuning";
import fumeTuning from "./fume/tuning";
import monetTuning from "./monet/tuning";
import partitaTuning from "./partita/tuning";
import pendoloTuning from "./pendolo/tuning";
import sonnetTuning from "./sonnet/tuning";
import tiltTuning from "./tilt/tuning";

// src/components/visualizer/tuningRegistry.ts
// Pure-data registry for transporting heterogeneous visualizer tuning without importing renderers.
export interface VisualizerTuningMap {
  classic: ClassicTuning;
  cadenza: CadenzaTuning;
  partita: PartitaTuning;
  fume: FumeTuning;
  claddagh: CladdaghTuning;
  cappella: CappellaTuning;
  tilt: TiltTuning;
  diorama: DioramaTuning;
  monet: MonetTuning;
  pendolo: PendoloTuning;
  sonnet: SonnetTuning;
}

export type VisualizerTuningMode = keyof VisualizerTuningMap;
export type VisualizerTuningBundle = Partial<VisualizerTuningMap>;

export interface VisualizerTuningAdapter<M extends VisualizerTuningMode = VisualizerTuningMode> {
  mode: M;
  settingsKey: string;
  settingsSetterKey: string;
  apply: (props: VisualizerSharedProps, tuning: VisualizerTuningMap[M]) => VisualizerSharedProps;
}

interface VisualizerTuningModule {
  default: VisualizerTuningAdapter;
}

export function defineVisualizerTuning<M extends VisualizerTuningMode>(
  adapter: VisualizerTuningAdapter<M>,
) {
  return adapter;
}

// Next.js host adapter: this is the exact tuning set discovered by Folia's Vite glob.
const tuningModules: Record<string, VisualizerTuningModule> = {
  "./cadenza/tuning.ts": { default: cadenzaTuning as VisualizerTuningAdapter },
  "./cappella/tuning.ts": { default: cappellaTuning as VisualizerTuningAdapter },
  "./claddagh/tuning.ts": { default: claddaghTuning as VisualizerTuningAdapter },
  "./classic/tuning.ts": { default: classicTuning as VisualizerTuningAdapter },
  "./diorama/tuning.ts": { default: dioramaTuning as VisualizerTuningAdapter },
  "./fume/tuning.ts": { default: fumeTuning as VisualizerTuningAdapter },
  "./monet/tuning.ts": { default: monetTuning as VisualizerTuningAdapter },
  "./partita/tuning.ts": { default: partitaTuning as VisualizerTuningAdapter },
  "./pendolo/tuning.ts": { default: pendoloTuning as VisualizerTuningAdapter },
  "./sonnet/tuning.ts": { default: sonnetTuning as VisualizerTuningAdapter },
  "./tilt/tuning.ts": { default: tiltTuning as VisualizerTuningAdapter },
};
const adapters = Object.values(tuningModules).map((module) => module.default);
const adaptersByMode = new Map<VisualizerTuningMode, VisualizerTuningAdapter>();

adapters.forEach((adapter) => {
  if (adaptersByMode.has(adapter.mode)) {
    throw new Error(`[VisualizerTuningRegistry] Duplicate adapter for "${adapter.mode}"`);
  }
  adaptersByMode.set(adapter.mode, adapter);
});

export const applyVisualizerTuning = (
  mode: VisualizerMode,
  props: VisualizerSharedProps,
  bundle?: VisualizerTuningBundle,
): VisualizerSharedProps => {
  const adapter = adaptersByMode.get(mode as VisualizerTuningMode);
  const tuning = bundle?.[mode as VisualizerTuningMode];
  return adapter && tuning ? adapter.apply(props, tuning as never) : props;
};

export const getVisualizerTuningModes = (): VisualizerTuningMode[] => [...adaptersByMode.keys()];

export const hasVisualizerTuningMode = (mode: VisualizerMode): mode is VisualizerTuningMode =>
  adaptersByMode.has(mode as VisualizerTuningMode);

export const collectVisualizerTunings = (
  settings: Record<string, unknown>,
): VisualizerTuningBundle => {
  const bundle: VisualizerTuningBundle = {};
  adapters.forEach((adapter) => {
    const value = settings[adapter.settingsKey];
    if (value !== undefined) {
      (bundle as Record<string, unknown>)[adapter.mode] = value;
    }
  });
  return bundle;
};

export const applyVisualizerTuningsToSettings = (
  settings: Record<string, unknown>,
  bundle: VisualizerTuningBundle,
) => {
  adapters.forEach((adapter) => {
    const value = bundle[adapter.mode];
    const setter = settings[adapter.settingsSetterKey];
    if (value !== undefined && typeof setter === "function") {
      setter(value);
    }
  });
};
