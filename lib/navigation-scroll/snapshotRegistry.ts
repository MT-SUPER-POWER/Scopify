import type {
  NavigationScrollEntryId,
  NavigationScrollSnapshot,
  NavigationScrollSnapshotRecord,
  NavigationScrollSnapshotRegistryLike,
  NavigationScrollSnapshotRegistryOptions,
} from "@/types/navigation-scroll";

const DEFAULT_MAX_ENTRIES = 80;
const DEFAULT_STORAGE_KEY = "scopify.navigation-scroll.snapshots.v1";

/**
 * Keeps full snapshots outside history.state. sessionStorage is intentionally
 * best effort: it improves same-tab reloads without making process restarts a
 * persistence guarantee.
 */
export class NavigationScrollSnapshotRegistry implements NavigationScrollSnapshotRegistryLike {
  private readonly maxEntries: number;
  private readonly records = new Map<NavigationScrollEntryId, NavigationScrollSnapshotRecord>();
  private readonly storageKey: string;

  constructor(options: NavigationScrollSnapshotRegistryOptions = {}) {
    this.maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
    this.storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY;
    this.restoreFromSessionStorage();
  }

  delete(entryId: NavigationScrollEntryId) {
    if (!this.records.delete(entryId)) return;
    this.persistToSessionStorage();
  }

  get(entryId: NavigationScrollEntryId): NavigationScrollSnapshot | null {
    const record = this.records.get(entryId);
    if (!record) return null;

    // Refresh recency without treating a read as a new scroll snapshot.
    this.records.delete(entryId);
    this.records.set(entryId, record);
    return record.snapshot;
  }

  set(entryId: NavigationScrollEntryId, snapshot: NavigationScrollSnapshot) {
    this.records.delete(entryId);
    this.records.set(entryId, { snapshot, updatedAt: Date.now() });
    this.trimToCapacity();
    this.persistToSessionStorage();
  }

  private trimToCapacity() {
    while (this.records.size > this.maxEntries) {
      const oldestEntryId = this.records.keys().next().value;
      if (!oldestEntryId) return;
      this.records.delete(oldestEntryId);
    }
  }

  private restoreFromSessionStorage() {
    if (typeof window === "undefined") return;

    try {
      const serialized = window.sessionStorage.getItem(this.storageKey);
      if (!serialized) return;

      const entries: unknown = JSON.parse(serialized);
      if (!Array.isArray(entries)) return;

      for (const entry of entries) {
        if (!Array.isArray(entry) || entry.length !== 2) continue;
        const [entryId, record] = entry;
        if (typeof entryId !== "string" || !isSnapshotRecord(record)) continue;
        this.records.set(entryId, record);
      }

      this.trimToCapacity();
    } catch {
      // Storage is optional and can be unavailable in private or embedded contexts.
    }
  }

  private persistToSessionStorage() {
    if (typeof window === "undefined") return;

    try {
      window.sessionStorage.setItem(this.storageKey, JSON.stringify([...this.records.entries()]));
    } catch {
      // A failed best-effort reload cache must not interrupt navigation.
    }
  }
}

function isSnapshotRecord(value: unknown): value is NavigationScrollSnapshotRecord {
  if (!isRecord(value) || typeof value.updatedAt !== "number" || !isRecord(value.snapshot)) {
    return false;
  }

  const snapshot = value.snapshot;
  if (snapshot.kind === "pixel") return typeof snapshot.top === "number";

  return (
    snapshot.kind === "virtual-collection" &&
    typeof snapshot.anchorKey === "string" &&
    typeof snapshot.anchorOffset === "number" &&
    typeof snapshot.fallbackTop === "number"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
