import { lazy } from "react";
import { DEFAULT_PRISMA_TUNING } from "@/types/lyrics/prisma/model";
import { defineVisualizer } from "../definition";

const VisualizerPrisma = lazy(() => import("@/components/lyrics/visuals/prisma/VisualizerPrisma"));
const PrismaSettingsPanel = lazy(
  () => import("@/components/lyrics/visuals/prisma/PrismaSettingsPanel"),
);

// Scopify's own style, like archive: registered here, built in components/lyrics/prisma and lib/lyrics/prisma.
// 聚散: each line bursts into shards that swirl on a current and gather into the next line as it is sung.
export default defineVisualizer({
  mode: "prisma",
  order: 30,
  labelKey: "folia.ui.visualizerPrisma",
  labelFallback: "聚散",
  previewSeed: "prisma",
  previewStartOffset: 0,
  tuningKind: "prisma",
  prewarmWhenIdle: true,
  prewarm: () => {
    void import("@/lib/lyrics/prisma/shaderWarmup")
      .then((module) => module.warmPrismaShaders())
      .catch((error) => console.warn("[Prisma] shader warm-up did not load", error));
  },
  // Unkeyed on the seed: the runtime takes a track change in place.
  render: (props) => (
    <VisualizerPrisma {...props} prismaTuning={props.prismaTuning ?? DEFAULT_PRISMA_TUNING} />
  ),
  renderSettingsPanel: (props) => <PrismaSettingsPanel {...props} />,
  resetSettings: ({ resetPrismaTuning, setDraftPrismaTuning }) => {
    setDraftPrismaTuning?.(DEFAULT_PRISMA_TUNING);
    resetPrismaTuning?.();
  },
});
