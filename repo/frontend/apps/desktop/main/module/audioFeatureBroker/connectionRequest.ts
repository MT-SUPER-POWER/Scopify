import type { AudioFeatureTransportRole } from "@scopifymusicplayer/desktop-contract";

export interface AudioFeatureConnectionRequest {
  connectionId: string;
  role: AudioFeatureTransportRole;
}

/** Binds broker ownership to Electron's sender identity instead of renderer input. */
export function createOwnedAudioFeatureConnectionId(
  role: AudioFeatureTransportRole,
  senderId: number,
): string {
  if (!Number.isInteger(senderId) || senderId < 0) {
    throw new RangeError("Audio-feature sender ID must be a non-negative integer.");
  }
  return `${role}:${senderId}`;
}

export function parseAudioFeatureConnectionRequest(
  value: unknown,
): AudioFeatureConnectionRequest | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (
    typeof record.connectionId !== "string" ||
    record.connectionId.length === 0 ||
    record.connectionId.length > 128
  ) {
    return null;
  }
  if (record.role !== "publisher" && record.role !== "subscriber") return null;
  return { connectionId: record.connectionId, role: record.role };
}
