import type { PlaybackTransportRole } from "@scopify/desktop-contract";

export interface PlaybackConnectionRequest {
  connectionId: string;
  role: PlaybackTransportRole;
}

/** Binds Broker ownership to Electron's sender identity instead of renderer input. */
export function createOwnedPlaybackConnectionId(
  role: PlaybackTransportRole,
  senderId: number,
): string {
  if (!Number.isInteger(senderId) || senderId < 0) {
    throw new RangeError("Playback sender ID must be a non-negative integer.");
  }
  return `${role}:${senderId}`;
}

export function parsePlaybackConnectionRequest(value: unknown): PlaybackConnectionRequest | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (
    typeof record.connectionId !== "string" ||
    record.connectionId.length === 0 ||
    record.connectionId.length > 128
  ) {
    return null;
  }
  if (record.role !== "authority" && record.role !== "replica") return null;
  return { connectionId: record.connectionId, role: record.role };
}
