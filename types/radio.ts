import type { SongDetail } from "@/types/api/music";
import type { RadioDetail, RadioHost } from "@/types/api/radio";

export interface RadioContent {
  host?: RadioHost;
  radio: RadioDetail;
  tracks: SongDetail[];
}
