import type { SongDetail } from "@/types/api/music";
import type { RadioDetail, RadioHost, RadioProgram } from "@/types/api/radio";

export interface RadioContent {
  host?: RadioHost;
  programs: RadioProgram[];
  radio: RadioDetail;
  tracks: SongDetail[];
}

export interface RadioSubscriptionVariables {
  radioId: number | string;
  subscribe: boolean;
}
