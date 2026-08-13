import { describe, expect, test } from "bun:test";

import {
  PLAYBACK_CHECKPOINT_PROTOCOL_VERSION,
  type PlaybackCheckpoint,
} from "@scopify/desktop-contract/playbackCheckpoint";

import {
  createPlaybackHostCheckpointRepository,
  type PlaybackHostCheckpointFileSystem,
} from "@/main/module/playbackHost/checkpoint";

class MemoryCheckpointFileSystem implements PlaybackHostCheckpointFileSystem {
  readonly files = new Map<string, string>();
  readonly operations: string[] = [];
  failRename = false;
  failUnlink = false;
  failWrite = false;

  async readFile(path: string) {
    this.operations.push(`read:${path}`);
    const value = this.files.get(path);
    if (value === undefined) throw createFileError("ENOENT");
    return value;
  }

  async rename(oldPath: string, newPath: string) {
    this.operations.push(`rename:${oldPath}:${newPath}`);
    if (this.failRename) throw new Error("rename failed");
    const value = this.files.get(oldPath);
    if (value === undefined) throw createFileError("ENOENT");
    this.files.set(newPath, value);
    this.files.delete(oldPath);
  }

  async unlink(path: string) {
    this.operations.push(`unlink:${path}`);
    if (this.failUnlink) throw new Error("unlink failed");
    if (!this.files.delete(path)) throw createFileError("ENOENT");
  }

  async writeFile(path: string, data: string) {
    this.operations.push(`write:${path}`);
    if (this.failWrite) throw new Error("write failed");
    this.files.set(path, data);
  }
}

function createCheckpoint(overrides: Partial<PlaybackCheckpoint> = {}): PlaybackCheckpoint {
  return {
    protocolVersion: PLAYBACK_CHECKPOINT_PROTOCOL_VERSION,
    savedAtMs: 1_700_000_000_000,
    session: {
      intent: "pause",
      quality: "high",
      queue: {
        historyIndex: 0,
        historyStack: [0],
        originalQueue: [createEntry(1)],
        playlistId: 77,
        queue: [createEntry(1)],
        queueIndex: 0,
        repeatMode: "all",
        shuffleEnabled: false,
      },
      resumePositionMs: 12_000,
      revision: 3,
      volume: 0.5,
    },
    ...overrides,
  };
}

function createEntry(id: number) {
  return {
    album: { artworkUrl: "https://image.example/cover.jpg", id: 9, title: "Album" },
    artists: [{ id: 8, name: "Artist" }],
    durationMs: 180_000,
    fee: 0,
    id,
    publishTime: 1_700_000_000_000,
    title: "Track",
  };
}

describe("Playback Host checkpoint repository", () => {
  test("saves through a temporary path, atomically replaces the checkpoint, and returns clones", async () => {
    const fileSystem = new MemoryCheckpointFileSystem();
    const repository = createPlaybackHostCheckpointRepository({
      checkpointPath: "/state/playback-checkpoint.json",
      fileSystem,
    });
    const checkpoint = createCheckpoint();

    expect(await repository.save(checkpoint)).toBeTrue();
    expect(fileSystem.operations).toEqual([
      "write:/state/playback-checkpoint.json.tmp",
      "rename:/state/playback-checkpoint.json.tmp:/state/playback-checkpoint.json",
    ]);
    expect(fileSystem.files.has("/state/playback-checkpoint.json.tmp")).toBeFalse();

    const restored = await repository.load();
    expect(restored).toEqual(checkpoint);
    if (!restored) throw new Error("expected checkpoint");
    restored.session.volume = 0;
    expect((await repository.load())?.session.volume).toBe(0.5);
    expect(repository.getDiagnostics()).toMatchObject({
      lastIssue: null,
      loadCount: 2,
      saveCount: 1,
    });
  });

  test("does not overwrite a valid checkpoint when its temporary write or rename fails", async () => {
    const fileSystem = new MemoryCheckpointFileSystem();
    const repository = createPlaybackHostCheckpointRepository({
      checkpointPath: "/state/checkpoint.json",
      fileSystem,
    });
    const original = createCheckpoint();
    await repository.save(original);

    fileSystem.failRename = true;
    const replacement = createCheckpoint({ savedAtMs: 1_700_000_000_100 });
    expect(await repository.save(replacement)).toBeFalse();
    expect(await repository.load()).toEqual(original);
    expect(repository.getDiagnostics()).toMatchObject({ lastIssue: "save-failed", saveCount: 1 });
  });

  test("treats missing, malformed, unknown-version, and source-bearing files as no checkpoint", async () => {
    const fileSystem = new MemoryCheckpointFileSystem();
    const path = "/state/checkpoint.json";
    const repository = createPlaybackHostCheckpointRepository({ checkpointPath: path, fileSystem });

    expect(await repository.load()).toBeNull();
    expect(repository.getDiagnostics()).toMatchObject({ missingLoadCount: 1, lastIssue: null });

    fileSystem.files.set(path, "not json");
    expect(await repository.load()).toBeNull();
    expect(repository.getDiagnostics()).toMatchObject({
      invalidCheckpointCount: 1,
      lastIssue: "invalid-json",
    });

    fileSystem.files.set(path, JSON.stringify({ ...createCheckpoint(), protocolVersion: 99 }));
    expect(await repository.load()).toBeNull();

    fileSystem.files.set(
      path,
      JSON.stringify({ ...createCheckpoint(), sourceUrl: "https://media.example/song.mp3" }),
    );
    expect(await repository.load()).toBeNull();
    expect(repository.getDiagnostics()).toMatchObject({
      invalidCheckpointCount: 3,
      lastIssue: "invalid-checkpoint",
    });
  });

  test("rejects an invalid input before it touches disk and clears both final and stale temporary files", async () => {
    const fileSystem = new MemoryCheckpointFileSystem();
    const path = "/state/checkpoint.json";
    const repository = createPlaybackHostCheckpointRepository({ checkpointPath: path, fileSystem });

    expect(
      await repository.save({ ...createCheckpoint(), sourceUrl: "https://media.example/song.mp3" }),
    ).toBeFalse();
    expect(fileSystem.operations).toEqual([]);
    expect(repository.getDiagnostics()).toMatchObject({
      invalidCheckpointCount: 1,
      lastIssue: "invalid-checkpoint",
    });

    fileSystem.files.set(path, JSON.stringify(createCheckpoint()));
    fileSystem.files.set(`${path}.tmp`, "stale partial write");
    expect(await repository.clear()).toBeTrue();
    expect(fileSystem.files.size).toBe(0);
    expect(repository.getDiagnostics()).toMatchObject({ clearCount: 1, lastIssue: null });
  });

  test("reports a failed clear but allows missing files to be cleared idempotently", async () => {
    const fileSystem = new MemoryCheckpointFileSystem();
    const repository = createPlaybackHostCheckpointRepository({
      checkpointPath: "/state/checkpoint.json",
      fileSystem,
    });

    expect(await repository.clear()).toBeTrue();
    fileSystem.files.set("/state/checkpoint.json", JSON.stringify(createCheckpoint()));
    fileSystem.failUnlink = true;
    expect(await repository.clear()).toBeFalse();
    expect(repository.getDiagnostics()).toMatchObject({ clearCount: 1, lastIssue: "clear-failed" });
  });
});

function createFileError(code: string): Error & { code: string } {
  return Object.assign(new Error(code), { code });
}
