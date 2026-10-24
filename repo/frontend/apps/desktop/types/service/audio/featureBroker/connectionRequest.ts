import type { AudioFeatureTransportRole } from "@scopify/desktop-contract";
export interface AudioFeatureConnectionRequest {
  connectionId: string;
  role: AudioFeatureTransportRole;
}
