import type { PlaybackTransportRole } from "@scopify/desktop-contract";
export interface PlaybackConnectionRequest {
  connectionId: string;
  role: PlaybackTransportRole;
}
