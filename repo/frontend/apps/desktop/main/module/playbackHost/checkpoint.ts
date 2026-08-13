import {
  type PlaybackCheckpoint,
  validatePlaybackCheckpoint,
} from "@mt-super-power/desktop-contract/playbackCheckpoint";
import * as nodeFs from "node:fs/promises";

const UTF8 = "utf8" as const;

export interface PlaybackHostCheckpointFileSystem {
  readFile(path: string, encoding: typeof UTF8): Promise<string>;
  rename(oldPath: string, newPath: string): Promise<void>;
  unlink(path: string): Promise<void>;
  writeFile(path: string, data: string, encoding: typeof UTF8): Promise<void>;
}

export type PlaybackHostCheckpointIssue =
  "invalid-checkpoint" | "invalid-json" | "load-failed" | "save-failed" | "clear-failed";

export interface PlaybackHostCheckpointDiagnostics {
  checkpointPath: string;
  clearCount: number;
  invalidCheckpointCount: number;
  lastIssue: PlaybackHostCheckpointIssue | null;
  loadCount: number;
  missingLoadCount: number;
  saveCount: number;
  temporaryPath: string;
}

export interface PlaybackHostCheckpointRepository {
  /** Removes the checkpoint and any abandoned temporary file. */
  clear(): Promise<boolean>;
  getDiagnostics(): PlaybackHostCheckpointDiagnostics;
  /** Returns null for missing, malformed, outdated, or unreadable persisted state. */
  load(): Promise<PlaybackCheckpoint | null>;
  /** Validates, serializes, then atomically replaces the persisted checkpoint. */
  save(checkpoint: unknown): Promise<boolean>;
}

export interface PlaybackHostCheckpointRepositoryOptions {
  checkpointPath: string;
  fileSystem?: PlaybackHostCheckpointFileSystem;
}

/**
 * Durable, deliberately narrow recovery repository for Playback Host session
 * seeds. Its only persisted payload is the versioned desktop contract; media
 * source URLs and renderer state cannot enter through this boundary.
 */
export function createPlaybackHostCheckpointRepository(
  options: PlaybackHostCheckpointRepositoryOptions,
): PlaybackHostCheckpointRepository {
  const checkpointPath = requireCheckpointPath(options.checkpointPath);
  const temporaryPath = `${checkpointPath}.tmp`;
  const fileSystem = options.fileSystem ?? nodeFs;

  let lastIssue: PlaybackHostCheckpointIssue | null = null;
  const counters = {
    clearCount: 0,
    invalidCheckpointCount: 0,
    loadCount: 0,
    missingLoadCount: 0,
    saveCount: 0,
  };

  async function load(): Promise<PlaybackCheckpoint | null> {
    counters.loadCount += 1;
    let encoded: string;
    try {
      encoded = await fileSystem.readFile(checkpointPath, UTF8);
    } catch (error) {
      if (isMissingFileError(error)) {
        counters.missingLoadCount += 1;
        return null;
      }
      lastIssue = "load-failed";
      return null;
    }

    let decoded: unknown;
    try {
      decoded = JSON.parse(encoded);
    } catch {
      lastIssue = "invalid-json";
      counters.invalidCheckpointCount += 1;
      return null;
    }

    const validation = validatePlaybackCheckpoint(decoded);
    if (!validation.success) {
      lastIssue = "invalid-checkpoint";
      counters.invalidCheckpointCount += 1;
      return null;
    }

    return cloneCheckpoint(validation.checkpoint);
  }

  async function save(checkpoint: unknown): Promise<boolean> {
    const validation = validatePlaybackCheckpoint(checkpoint);
    if (!validation.success) {
      lastIssue = "invalid-checkpoint";
      counters.invalidCheckpointCount += 1;
      return false;
    }

    let encoded: string;
    try {
      encoded = JSON.stringify(validation.checkpoint);
    } catch {
      lastIssue = "save-failed";
      return false;
    }

    try {
      // A failed write can only damage the temporary file. The existing
      // checkpoint remains loadable until the atomic rename succeeds.
      await fileSystem.writeFile(temporaryPath, encoded, UTF8);
      await fileSystem.rename(temporaryPath, checkpointPath);
      counters.saveCount += 1;
      lastIssue = null;
      return true;
    } catch {
      lastIssue = "save-failed";
      return false;
    }
  }

  async function clear(): Promise<boolean> {
    const results = await Promise.all([
      removeIfPresent(checkpointPath),
      removeIfPresent(temporaryPath),
    ]);
    if (results.every(Boolean)) {
      counters.clearCount += 1;
      lastIssue = null;
      return true;
    }
    lastIssue = "clear-failed";
    return false;
  }

  async function removeIfPresent(path: string): Promise<boolean> {
    try {
      await fileSystem.unlink(path);
      return true;
    } catch (error) {
      return isMissingFileError(error);
    }
  }

  return {
    clear,
    getDiagnostics() {
      return {
        ...counters,
        checkpointPath,
        lastIssue,
        temporaryPath,
      };
    },
    load,
    save,
  };
}

function requireCheckpointPath(path: string): string {
  if (typeof path !== "string" || path.trim().length === 0) {
    throw new RangeError("Playback Host checkpoint path must be a non-empty string.");
  }
  return path;
}

function isMissingFileError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "ENOENT"
  );
}

function cloneCheckpoint(checkpoint: PlaybackCheckpoint): PlaybackCheckpoint {
  return structuredClone(checkpoint);
}
