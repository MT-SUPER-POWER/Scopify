import { describe, expect, test } from "bun:test";

import type { PlaybackProjection } from "@scopify/desktop-contract";
import type { PlaybackGateway, PlaybackGatewayCommand } from "@main/capabilities/playbackGateway";
import { createMcpCredentialStore } from "@main/capabilities/mcp/credentialStore";
import { createMcpEndpoint } from "@main/capabilities/mcp/endpoint";
import { createMcpHttpServer } from "@main/capabilities/mcp/http";
import { createMcpRuntime } from "@main/capabilities/mcp/runtime";

function createGateway(): PlaybackGateway {
  const dispatch = async (command: PlaybackGatewayCommand) => ({
    commandId: command.type,
    status: "accepted" as const,
  });
  return {
    dispose() {},
    dispatch,
    getSnapshot: () => createSnapshot(),
    next: () => dispatch({ type: "next" }),
    pause: () => dispatch({ type: "pause" }),
    play: () => dispatch({ type: "play" }),
    previous: () => dispatch({ type: "previous" }),
    seek: (positionMs) => dispatch({ positionMs, type: "seek" }),
    setVolume: (volume) => dispatch({ type: "set-volume", volume }),
    subscribe: () => () => {},
    toggle: () => dispatch({ type: "toggle" }),
  };
}

function createSnapshot(): PlaybackProjection {
  return {
    authorityId: "authority",
    canControl: true,
    connection: "connected",
    durationMs: 120_000,
    isPlaying: true,
    liked: false,
    lyrics: ["private"],
    lyricsVersion: 1,
    phase: "playing",
    positionMs: 5_000,
    sessionId: "session",
    track: { artistNames: ["Artist"], id: 1, title: "Track" },
    volume: 50,
  };
}

describe("MCP HTTP security and runtime lifecycle", () => {
  test("credential rotation wins over an in-flight persistent credential load", async () => {
    let releaseLoad!: (value: string | null) => void;
    const loading = new Promise<string | null>((resolve) => {
      releaseLoad = resolve;
    });
    const saved: string[] = [];
    const credentials = createMcpCredentialStore({
      createToken: () => "rotated-token",
      persistence: {
        load: () => loading,
        save: async (token) => {
          saved.push(token);
        },
      },
    });

    const firstRead = credentials.getOrCreate();
    const rotation = credentials.rotate();
    releaseLoad("persisted-token");

    expect(await firstRead).toBe("persisted-token");
    expect(await rotation).toBe("rotated-token");
    expect(await credentials.verify("persisted-token")).toBeFalse();
    expect(await credentials.verify("rotated-token")).toBeTrue();
    expect(saved).toEqual(["rotated-token"]);
  });

  test("requires a bearer token before reaching the endpoint", async () => {
    const credentials = createMcpCredentialStore({ createToken: () => "known-token" });
    const endpoint = createMcpEndpoint({
      createServer: () => {
        throw new Error("The endpoint must not be reached without authentication.");
      },
    });
    const httpServer = createMcpHttpServer({ credentials, endpoint });
    const port = await httpServer.listen(0);

    const denied = await fetch(`http://127.0.0.1:${port}/mcp`, {
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    expect(denied.status).toBe(401);

    const invalidOrigin = await fetch(`http://127.0.0.1:${port}/mcp`, {
      body: JSON.stringify({}),
      headers: {
        authorization: "Bearer known-token",
        "content-type": "application/json",
        origin: "https://attacker.example",
      },
      method: "POST",
    });
    expect(invalidOrigin.status).toBe(403);

    // Loopback binding alone does not prevent DNS rebinding: a hostile Host
    // header must be rejected before a valid bearer token can reach MCP.
    const invalidHost = await fetch(`http://127.0.0.1:${port}/mcp`, {
      body: JSON.stringify({}),
      headers: {
        authorization: "Bearer known-token",
        "content-type": "application/json",
        host: "attacker.example",
      },
      method: "POST",
    });
    expect(invalidHost.status).toBe(403);
    await httpServer.close();
    await endpoint.close();
  });

  test("starts on loopback, reports the assigned port, rotates credentials, and stops", async () => {
    const credentials = createMcpCredentialStore({
      createToken: (() => {
        let number = 0;
        return () => `token-${++number}`;
      })(),
    });
    const runtime = createMcpRuntime({
      credentials,
      playback: createGateway(),
      version: "test",
    });

    const started = await runtime.start({
      capabilities: ["playback.read"],
      enabled: true,
      port: 0,
    });
    expect(started).toMatchObject({ enabled: true, state: "listening" });
    expect(started.port).toBeGreaterThan(0);

    const initialized = await fetch(`http://127.0.0.1:${started.port}/mcp`, {
      body: JSON.stringify({
        id: 1,
        jsonrpc: "2.0",
        method: "initialize",
        params: {
          capabilities: {},
          clientInfo: { name: "scopify-test", version: "1.0" },
          protocolVersion: "2025-11-25",
        },
      }),
      headers: {
        accept: "application/json, text/event-stream",
        authorization: "Bearer token-1",
        "content-type": "application/json",
      },
      method: "POST",
    });
    const sessionId = initialized.headers.get("mcp-session-id");
    expect(initialized.status).toBe(200);
    expect(sessionId).toBeString();

    const listedTools = await fetch(`http://127.0.0.1:${started.port}/mcp`, {
      body: JSON.stringify({ id: 2, jsonrpc: "2.0", method: "tools/list", params: {} }),
      headers: {
        accept: "application/json, text/event-stream",
        authorization: "Bearer token-1",
        "content-type": "application/json",
        "mcp-protocol-version": "2025-11-25",
        "mcp-session-id": sessionId!,
      },
      method: "POST",
    });
    const listBody = (await listedTools.json()) as { result: { tools: Array<{ name: string }> } };
    expect(listedTools.status).toBe(200);
    expect(listBody.result.tools.map((tool) => tool.name)).toEqual([
      "get_playback_status",
      "get_now_playing",
      "play",
      "pause",
      "toggle_playback",
      "next_track",
      "previous_track",
      "seek",
      "set_volume",
    ]);

    const deniedControl = await fetch(`http://127.0.0.1:${started.port}/mcp`, {
      body: JSON.stringify({
        id: 3,
        jsonrpc: "2.0",
        method: "tools/call",
        params: { name: "play" },
      }),
      headers: {
        accept: "application/json, text/event-stream",
        authorization: "Bearer token-1",
        "content-type": "application/json",
        "mcp-protocol-version": "2025-11-25",
        "mcp-session-id": sessionId!,
      },
      method: "POST",
    });
    const deniedBody = (await deniedControl.json()) as {
      result: { content: Array<{ text: string }>; isError: boolean };
    };
    expect(deniedControl.status).toBe(200);
    expect(deniedBody.result.isError).toBeTrue();
    expect(deniedBody.result.content[0]?.text).toContain("capability-denied");

    const client = await runtime.rotateCredential();
    expect(client).toEqual({
      headers: { Authorization: "Bearer token-2" },
      transport: "streamable-http",
      url: `http://127.0.0.1:${started.port}/mcp`,
    });
    expect(await credentials.verify("token-1")).toBeFalse();
    expect(await credentials.verify("token-2")).toBeTrue();

    await runtime.stop();
    expect(runtime.getStatus()).toEqual({ enabled: false, port: null, state: "stopped" });
  });
});
