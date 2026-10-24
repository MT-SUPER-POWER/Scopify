import type { MotionValue } from "framer-motion";
import type { Theme, SoraBackgroundTuning } from "@/components/lyrics/folia/src/types";

export interface SoraBackgroundProps {
  theme: Theme;
  isDaylight: boolean;
  paused?: boolean;
  tuning?: SoraBackgroundTuning;
  audioPower?: MotionValue<number>;
}
