import { Client, type SetActivity } from "@xhayper/discord-rpc";
import type {
  DiscordPresenceSnapshot,
  DiscordPresenceStatus,
} from "@mt-super-power/desktop-contract";

const DISCORD_PRESENCE_UPDATE_INTERVAL_MS = 15_000;
const DISCORD_ACTIVITY_TYPE_LISTENING = 2;

export interface DiscordPresenceControllerOptions {
  getApplicationId(): string;
  isEnabled(): boolean;
  onStatusChange?(status: DiscordPresenceStatus): void;
}

export function normalizeDiscordApplicationId(value: string): string {
  const trimmed = value.trim();
  return /^\d{16,24}$/.test(trimmed) ? trimmed : "";
}

export function normalizeDiscordImageUrl(value: string | null): string {
  if (!value?.trim()) return "";

  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    const hostname = url.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname.endsWith(".localhost")
    ) {
      return "";
    }
    if (url.protocol === "http:") url.protocol = "https:";
    return url.toString();
  } catch {
    return "";
  }
}

function normalizeDiscordActivityText(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase();
}

function isDuplicateDiscordActivityText(value: string, existingValues: string[]) {
  const normalizedValue = normalizeDiscordActivityText(value);
  return (
    Boolean(normalizedValue) && existingValues.some((existing) => normalizedValue === existing)
  );
}

function buildDiscordSubtitle(snapshot: DiscordPresenceSnapshot) {
  const title = snapshot.title.trim();
  const normalizedTitle = normalizeDiscordActivityText(title);
  const artist = snapshot.artist.trim();
  if (!isDuplicateDiscordActivityText(artist, [normalizedTitle])) return artist || "Scopify";

  const album = snapshot.album.trim();
  if (!isDuplicateDiscordActivityText(album, [normalizedTitle])) return album;

  return "Scopify";
}

function buildDiscordCoverCaption(snapshot: DiscordPresenceSnapshot, subtitle: string) {
  const excludedValues = [
    normalizeDiscordActivityText(snapshot.title),
    normalizeDiscordActivityText(subtitle),
  ];
  const album = snapshot.album.trim();
  if (!isDuplicateDiscordActivityText(album, excludedValues)) return album;

  return "Scopify";
}

export function buildDiscordActivity(snapshot: DiscordPresenceSnapshot): SetActivity | null {
  const title = snapshot.title.trim();
  if (!title) return null;

  const subtitle = buildDiscordSubtitle(snapshot);
  const coverUrl = normalizeDiscordImageUrl(snapshot.coverUrl);
  const activity: SetActivity = {
    details: title.slice(0, 128),
    instance: false,
    name: "Scopify",
    smallImageText: snapshot.isPlaying ? "Playing" : "Paused",
    state: snapshot.isPlaying ? subtitle.slice(0, 128) : `Paused - ${subtitle.slice(0, 118)}`,
    type: DISCORD_ACTIVITY_TYPE_LISTENING,
  };

  if (coverUrl) {
    activity.largeImageKey = coverUrl;
    activity.largeImageText = buildDiscordCoverCaption(snapshot, subtitle).slice(0, 128);
  }

  const durationMs = Math.max(0, snapshot.durationMs);
  const positionMs = Math.max(0, snapshot.positionMs);
  if (snapshot.isPlaying && durationMs > positionMs + 1_000) {
    const sampledAtMs = Number.isFinite(snapshot.sampledAtMs) ? snapshot.sampledAtMs : Date.now();
    activity.startTimestamp = new Date(Math.max(0, sampledAtMs - positionMs));
    activity.endTimestamp = new Date(sampledAtMs + durationMs - positionMs);
  }

  return activity;
}

export function getDiscordActivityKey(activity: SetActivity | null): string {
  if (!activity) return "empty";
  return JSON.stringify({
    details: activity.details,
    largeImageKey: activity.largeImageKey,
    largeImageText: activity.largeImageText,
    state: activity.state,
  });
}

function hasPositionDiscontinuity(
  previous: DiscordPresenceSnapshot | null,
  current: DiscordPresenceSnapshot,
) {
  if (!previous || !previous.isPlaying || !current.isPlaying) return false;
  const elapsedMs = Math.max(0, current.sampledAtMs - previous.sampledAtMs);
  const expectedPositionMs = previous.positionMs + elapsedMs;
  return Math.abs(current.positionMs - expectedPositionMs) > 2_000;
}

export function createDiscordPresenceController({
  getApplicationId,
  isEnabled,
  onStatusChange,
}: DiscordPresenceControllerOptions) {
  let client: Client | null = null;
  let connectingPromise: Promise<Client | null> | null = null;
  let currentApplicationId = "";
  let lastActivityKey = "";
  let lastSnapshot: DiscordPresenceSnapshot | null = null;
  let lastUpdateAtMs = 0;
  let status: DiscordPresenceStatus = {
    applicationId: null,
    configured: false,
    connected: false,
    enabled: false,
    error: null,
    updatedAtMs: Date.now(),
  };

  function publishStatus(patch: Partial<DiscordPresenceStatus>) {
    const nextStatus: DiscordPresenceStatus = { ...status, ...patch, updatedAtMs: Date.now() };
    const changed =
      nextStatus.applicationId !== status.applicationId ||
      nextStatus.configured !== status.configured ||
      nextStatus.connected !== status.connected ||
      nextStatus.enabled !== status.enabled ||
      nextStatus.error !== status.error;
    status = nextStatus;
    if (changed) onStatusChange?.({ ...status });
    return { ...status };
  }

  async function destroyClient() {
    const activeClient = client;
    client = null;
    connectingPromise = null;
    lastActivityKey = "";
    lastUpdateAtMs = 0;
    if (!activeClient) return;
    try {
      await activeClient.user?.clearActivity(process.pid);
    } catch {
      // The Discord desktop IPC may already be closed.
    }
    try {
      await activeClient.destroy();
    } catch {
      // Disconnecting is best effort.
    }
  }

  async function ensureClient(): Promise<Client | null> {
    const applicationId = normalizeDiscordApplicationId(getApplicationId());
    const enabled = isEnabled();
    publishStatus({
      applicationId: applicationId || null,
      configured: Boolean(applicationId),
      enabled,
    });

    if (!enabled || !applicationId) {
      await destroyClient();
      publishStatus({
        connected: false,
        error: enabled ? "A valid Discord Application ID is required." : null,
      });
      return null;
    }

    if (client?.isConnected && currentApplicationId === applicationId) return client;
    if (connectingPromise && currentApplicationId === applicationId) return connectingPromise;

    await destroyClient();
    currentApplicationId = applicationId;
    connectingPromise = (async () => {
      try {
        const nextClient = new Client({ clientId: applicationId, transport: { type: "ipc" } });
        nextClient.on("disconnected", () => {
          if (client === nextClient) {
            publishStatus({ connected: false, error: "Discord disconnected." });
          }
        });
        await nextClient.login();
        client = nextClient;
        publishStatus({ connected: true, error: null });
        return nextClient;
      } catch (error) {
        client = null;
        publishStatus({
          connected: false,
          error: error instanceof Error ? error.message : String(error),
        });
        return null;
      } finally {
        connectingPromise = null;
      }
    })();
    return connectingPromise;
  }

  async function publishSnapshot(snapshot: DiscordPresenceSnapshot) {
    const previousSnapshot = lastSnapshot;
    lastSnapshot = snapshot;
    const activity = buildDiscordActivity(snapshot);
    const activeClient = await ensureClient();
    if (!activeClient) return { ...status };

    if (!activity) {
      if (lastActivityKey !== "empty") {
        try {
          await activeClient.user?.clearActivity(process.pid);
          lastActivityKey = "empty";
          publishStatus({ connected: true, error: null });
        } catch (error) {
          publishStatus({
            connected: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
      return { ...status };
    }

    const activityKey = getDiscordActivityKey(activity);
    const now = Date.now();
    if (
      activityKey === lastActivityKey &&
      !hasPositionDiscontinuity(previousSnapshot, snapshot) &&
      now - lastUpdateAtMs < DISCORD_PRESENCE_UPDATE_INTERVAL_MS
    ) {
      return { ...status };
    }

    try {
      await activeClient.user?.setActivity(activity, process.pid);
      lastActivityKey = activityKey;
      lastUpdateAtMs = now;
      publishStatus({ connected: true, error: null });
    } catch (error) {
      publishStatus({
        connected: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return { ...status };
  }

  async function testConnection() {
    await ensureClient();
    return { ...status };
  }

  return {
    destroy: destroyClient,
    getStatus: () => ({ ...status }),
    publishSnapshot,
    refresh: () => (lastSnapshot ? publishSnapshot(lastSnapshot) : Promise.resolve({ ...status })),
    testConnection,
  };
}
