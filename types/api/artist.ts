import type { FollowedArtist } from "@/types/artist";

export interface FollowedArtistsResponse {
  code: number;
  data?: FollowedArtist[];
}
