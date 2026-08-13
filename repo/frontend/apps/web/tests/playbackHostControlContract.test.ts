import { describe, expect, test } from "bun:test";

import {
  PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
  type PlaybackHostQueueCommand,
  type PlaybackHostReplaceSessionCommand,
  validatePlaybackHostControlPayload,
  validatePlaybackHostControlReceipt,
  validatePlaybackHostQueueCommand,
  validatePlaybackHostReplaceSessionCommand,
  validatePlaybackHostSessionSnapshot,
} from "@mt-super-power/desktop-contract/playbackHostControl";

function createReplaceSessionCommand(): PlaybackHostReplaceSessionCommand {
  return {
    commandId: "main:replace:1",
    protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
    session: {
      intent: "play",
      quality: "lossless",
      queue: {
        historyIndex: 0,
        historyStack: [0],
        originalQueue: [createEntry(1)],
        playlistId: "playlist:daily",
        queue: [createEntry(1)],
        queueIndex: 0,
        repeatMode: "all",
        shuffleEnabled: false,
      },
      resumePositionMs: 12_345,
      revision: 7,
      volume: 0.8,
    },
    type: "replace-session",
  };
}

function createEntry(id: number) {
  return {
    album: { artworkUrl: "https://image.example/cover.jpg", id: 8, title: "Album" },
    alias: ["Alt title"],
    artists: [{ id: 2, name: "Artist" }],
    durationMs: 180_000,
    fee: 0,
    id,
    publishTime: 1_700_000_000_000,
    title: "Track",
    voiceId: 3,
  };
}

describe("PlaybackHostControl contract", () => {
  test("accepts a complete, lossless queue and session seed", () => {
    const command = createReplaceSessionCommand();

    expect(validatePlaybackHostReplaceSessionCommand(command)).toEqual({
      command,
      success: true,
    });
    expect(validatePlaybackHostControlPayload(command)).toEqual({
      payload: command,
      success: true,
    });
  });

  test("rejects non-finite session values and an out-of-range volume", () => {
    const nanRevision = createReplaceSessionCommand();
    nanRevision.session.revision = Number.NaN;
    expect(validatePlaybackHostReplaceSessionCommand(nanRevision).success).toBeFalse();

    const infinitePosition = createReplaceSessionCommand();
    infinitePosition.session.resumePositionMs = Number.POSITIVE_INFINITY;
    expect(validatePlaybackHostReplaceSessionCommand(infinitePosition).success).toBeFalse();

    const invalidVolume = createReplaceSessionCommand();
    invalidVolume.session.volume = 1.01;
    expect(validatePlaybackHostReplaceSessionCommand(invalidVolume).success).toBeFalse();
  });

  test("rejects queue snapshots larger than the bounded wire limit", () => {
    const command = createReplaceSessionCommand();
    command.session.queue.queue = Array.from({ length: 10_001 }, (_, index) => createEntry(index));
    command.session.queue.originalQueue = [...command.session.queue.queue];
    command.session.queue.queueIndex = 0;
    command.session.queue.historyStack = [0];

    expect(validatePlaybackHostReplaceSessionCommand(command).success).toBeFalse();
  });

  test("rejects inconsistent queue and history indexes", () => {
    const command = createReplaceSessionCommand();
    command.session.queue.historyStack = [1];
    expect(validatePlaybackHostReplaceSessionCommand(command).success).toBeFalse();

    const emptyQueue = createReplaceSessionCommand();
    emptyQueue.session.queue.queue = [];
    emptyQueue.session.queue.originalQueue = [];
    emptyQueue.session.queue.queueIndex = 0;
    expect(validatePlaybackHostReplaceSessionCommand(emptyQueue).success).toBeFalse();
  });

  test("rejects unknown fields and unsupported protocol versions", () => {
    const withUnknownField = {
      ...createReplaceSessionCommand(),
      sourceUrl: "https://forbidden.example",
    };
    expect(validatePlaybackHostReplaceSessionCommand(withUnknownField).success).toBeFalse();

    const unsupportedVersion = { ...createReplaceSessionCommand(), protocolVersion: 2 };
    expect(validatePlaybackHostControlPayload(unsupportedVersion).success).toBeFalse();
  });

  test("accepts every Host-owned queue command and exposes it through the control payload union", () => {
    const commands: PlaybackHostQueueCommand[] = [
      {
        addToHistory: true,
        commandId: "main:queue:select",
        index: 0,
        protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
        type: "select-queue-index",
      },
      {
        commandId: "main:queue:replace",
        play: true,
        playlistId: "playlist:daily",
        protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
        queue: [createEntry(1), createEntry(2)],
        startIndex: 1,
        type: "replace-queue",
      },
      {
        commandId: "main:queue:repeat",
        protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
        repeatMode: "one",
        type: "set-repeat-mode",
      },
      {
        commandId: "main:queue:shuffle",
        enabled: true,
        protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
        type: "set-shuffle",
      },
      {
        commandId: "main:queue:toggle-shuffle",
        protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
        type: "toggle-shuffle",
      },
      {
        commandId: "main:queue:reshuffle",
        protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
        type: "reshuffle-queue",
      },
      {
        commandId: "main:queue:move",
        fromIndex: 0,
        protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
        toIndex: 1,
        type: "move-queue-item",
      },
      {
        commandId: "main:queue:move-next",
        index: 0,
        protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
        type: "move-queue-item-to-next",
      },
      {
        commandId: "main:queue:remove",
        index: 0,
        protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
        type: "remove-queue-item",
      },
    ];

    for (const command of commands) {
      expect(validatePlaybackHostQueueCommand(command)).toEqual({ command, success: true });
      expect(validatePlaybackHostControlPayload(command)).toEqual({
        payload: command,
        success: true,
      });
    }
  });

  test("rejects queue commands with malformed fields, indexes, or queue bounds", () => {
    expect(
      validatePlaybackHostQueueCommand({
        commandId: "main:queue:replace",
        play: true,
        playlistId: null,
        protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
        queue: [createEntry(1)],
        startIndex: 1,
        type: "replace-queue",
      }).success,
    ).toBeFalse();

    expect(
      validatePlaybackHostQueueCommand({
        commandId: "main:queue:set-shuffle",
        enabled: "true",
        protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
        type: "set-shuffle",
      }).success,
    ).toBeFalse();

    expect(
      validatePlaybackHostQueueCommand({
        commandId: "main:queue:move",
        fromIndex: -1,
        protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
        toIndex: 0,
        type: "move-queue-item",
      }).success,
    ).toBeFalse();

    expect(
      validatePlaybackHostQueueCommand({
        commandId: "main:queue:unknown-field",
        index: 0,
        protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
        sourceUrl: "https://forbidden.example",
        type: "remove-queue-item",
      }).success,
    ).toBeFalse();
  });

  test("accepts snapshots and only receipts with the matching wire shape", () => {
    const session = createReplaceSessionCommand().session;
    expect(
      validatePlaybackHostSessionSnapshot({
        protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
        session,
        type: "session-snapshot",
      }),
    ).toEqual({
      snapshot: {
        protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
        session,
        type: "session-snapshot",
      },
      success: true,
    });

    expect(
      validatePlaybackHostControlReceipt({
        commandId: "main:replace:1",
        protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
        revision: 7,
        status: "applied",
        type: "command-receipt",
      }).success,
    ).toBeTrue();
    expect(
      validatePlaybackHostControlReceipt({
        commandId: "main:replace:1",
        protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
        revision: 7,
        status: "rejected",
        type: "command-receipt",
      }).success,
    ).toBeFalse();
  });
});
