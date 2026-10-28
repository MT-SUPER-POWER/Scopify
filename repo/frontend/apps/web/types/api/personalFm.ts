import type { RawSongDetail } from "@/types/song/api";

export interface PersonalFmResponse {
  code: number;
  data?: RawSongDetail[];
  message?: string;
  msg?: string;
}

export interface PersonalFmModeParams {
  mode: string;
  submode?: string;
}

export interface PersonalFmTrashResponse {
  code: number;
  message?: string;
}
