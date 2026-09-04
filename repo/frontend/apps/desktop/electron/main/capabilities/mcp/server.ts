import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
// Keep this on the same Zod major as the MCP SDK. Two physical Zod versions
// make the SDK's schema compatibility union recurse deeply in TypeScript.
import { z } from "zod";

import type { McpAuditLog } from "./audit";
import type { McpPlaybackToolFacade } from "./tools/playback";

export interface CreateScopifyMcpServerOptions {
  audit: McpAuditLog;
  playback: McpPlaybackToolFacade;
  version: string;
}

const seekInputSchema = z.object({ positionMs: z.number().finite().min(0) });
const volumeInputSchema = z.object({ volume: z.number().finite().min(0).max(100) });

/**
 * Registers Scopify's intentionally narrow V1 MCP surface. Tool handlers use
 * the facade rather than importing the Broker or a Renderer implementation.
 */
export function createScopifyMcpServer(options: CreateScopifyMcpServerOptions): McpServer {
  const server = new McpServer({ name: "scopify", version: options.version });

  server.registerTool(
    "get_playback_status",
    {
      annotations: { idempotentHint: true, readOnlyHint: true },
      description:
        "Get the current player state, progress, duration, and volume. Time is in milliseconds.",
      title: "Get playback status",
    },
    () =>
      toolResult(options.audit, "get_playback_status", () => options.playback.getPlaybackStatus()),
  );
  server.registerTool(
    "get_now_playing",
    {
      annotations: { idempotentHint: true, readOnlyHint: true },
      description:
        "Get a small current-track snapshot. It never includes lyrics, source URLs, or credentials.",
      title: "Get now playing",
    },
    () => toolResult(options.audit, "get_now_playing", () => options.playback.getNowPlaying()),
  );

  registerControlTool(server, options, "play", "Resume playback", () => options.playback.play());
  registerControlTool(server, options, "pause", "Pause playback", () => options.playback.pause());
  registerControlTool(server, options, "toggle_playback", "Toggle playback", () =>
    options.playback.togglePlayback(),
  );
  registerControlTool(server, options, "next_track", "Play the next track", () =>
    options.playback.nextTrack(),
  );
  registerControlTool(server, options, "previous_track", "Play the previous track", () =>
    options.playback.previousTrack(),
  );

  server.registerTool(
    "seek",
    {
      annotations: { destructiveHint: false, idempotentHint: true, readOnlyHint: false },
      description: "Seek the current track to an absolute position in milliseconds.",
      inputSchema: seekInputSchema,
      title: "Seek playback",
    },
    ({ positionMs }) => toolResult(options.audit, "seek", () => options.playback.seek(positionMs)),
  );
  server.registerTool(
    "set_volume",
    {
      annotations: { destructiveHint: false, idempotentHint: true, readOnlyHint: false },
      description: "Set player volume from 0 to 100.",
      inputSchema: volumeInputSchema,
      title: "Set volume",
    },
    ({ volume }) =>
      toolResult(options.audit, "set_volume", () => options.playback.setVolume(volume)),
  );

  return server;
}

function registerControlTool(
  server: McpServer,
  options: CreateScopifyMcpServerOptions,
  name: "play" | "pause" | "toggle_playback" | "next_track" | "previous_track",
  description: string,
  action: () => ReturnType<McpPlaybackToolFacade["play"]>,
) {
  server.registerTool(
    name,
    {
      annotations: { destructiveHint: false, idempotentHint: false, readOnlyHint: false },
      description,
      title: description,
    },
    () => toolResult(options.audit, name, action),
  );
}

async function toolResult<T>(audit: McpAuditLog, tool: string, action: () => T | Promise<T>) {
  const startedAtMs = Date.now();
  try {
    const value = await action();
    const outcome = getOutcome(value);
    audit.record({
      durationMs: Date.now() - startedAtMs,
      outcome,
      timestampMs: startedAtMs,
      tool,
    });
    return {
      content: [{ text: JSON.stringify(value), type: "text" as const }],
      isError: outcome === "rejected" || outcome === "unavailable",
    };
  } catch {
    audit.record({
      durationMs: Date.now() - startedAtMs,
      outcome: "unavailable",
      timestampMs: startedAtMs,
      tool,
    });
    return {
      content: [
        {
          text: JSON.stringify({ reason: "playback-operation-failed", success: false }),
          type: "text" as const,
        },
      ],
      isError: true,
    };
  }
}

function getOutcome(value: unknown): "accepted" | "rejected" | "unavailable" {
  if (
    typeof value === "object" &&
    value !== null &&
    "receipt" in value &&
    typeof (value as { receipt?: { status?: unknown } }).receipt?.status === "string"
  ) {
    const status = (value as { receipt: { status: string } }).receipt.status;
    if (status === "accepted" || status === "rejected" || status === "unavailable") return status;
  }
  if (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    (value as { success?: unknown }).success === false
  ) {
    return "rejected";
  }
  return "accepted";
}
