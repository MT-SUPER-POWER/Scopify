import type { PlaybackHostControlTransportRole } from "@scopifymusicplayer/desktop-contract";

export interface PlaybackHostControlConnectionRequest {
  connectionId: string;
  role: PlaybackHostControlTransportRole;
}

/**
 * Broker ownership is deliberately derived from Electron's webContents ID,
 * never from a renderer-provided connection ID.
 */
export function createOwnedPlaybackHostControlConnectionId(
  role: PlaybackHostControlTransportRole,
  senderId: number,
): string {
  if (!Number.isInteger(senderId) || senderId < 0) {
    throw new RangeError("Playback Host control sender ID must be a non-negative integer.");
  }
  return `${role}:${senderId}`;
}

export function parsePlaybackHostControlConnectionRequest(
  value: unknown,
): PlaybackHostControlConnectionRequest | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (
    typeof record.connectionId !== "string" ||
    record.connectionId.length === 0 ||
    record.connectionId.length > 128
  ) {
    return null;
  }
  if (record.role !== "client" && record.role !== "host") return null;
  return { connectionId: record.connectionId, role: record.role };
}
