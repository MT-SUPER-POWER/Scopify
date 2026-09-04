import type { NativeModuleLoader } from "@main/services/nativeModuleLoader";

import type {
  NativeAudioAvailability,
  NativeAudioEvent,
  NativeAudioFailure,
  NativeAudioHost,
  NativeAudioLoadRequest,
  NativeAudioOperationResult,
  NativeAudioPhase,
  NativeAudioPlayerPort,
  NativeAudioSnapshot,
} from "./types";

export type {
  NativeAudioAvailability,
  NativeAudioEvent,
  NativeAudioFailure,
  NativeAudioFailureKind,
  NativeAudioHost,
  NativeAudioLoadRequest,
  NativeAudioOperationResult,
  NativeAudioPhase,
  NativeAudioSnapshot,
  NativeAudioSource,
} from "./types";

export interface NativeAudioHostOptions {
  loader: NativeModuleLoader;
}

const INITIAL_SNAPSHOT: NativeAudioSnapshot = {
  durationMs: 0,
  error: null,
  loadId: null,
  phase: "idle",
  positionMs: 0,
  token: null,
  volume: 1,
};

/**
 * Owns the one optional NAPI audio player in Electron Main.
 *
 * This is intentionally not an Electron IPC adapter and not an
 * `AudioEngineAdapter`. It is the platform host below those seams. The future
 * Desktop adapter is responsible for turning this host's safe snapshot/events
 * into the shared playback contract.
 */
export function createNativeAudioHost(options: NativeAudioHostOptions): NativeAudioHost {
  let availability: NativeAudioAvailability | null = null;
  let disposed = false;
  let activeLoadRequestRevision: number | null = null;
  let nextLoadRequestRevision = 0;
  let player: NativeAudioPlayerPort | null = null;
  let snapshot = cloneSnapshot(INITIAL_SNAPSHOT);
  const listeners = new Set<(event: NativeAudioEvent) => void>();

  function getAvailability(): NativeAudioAvailability {
    if (disposed) {
      return {
        available: false,
        diagnostic: "The native audio host has been disposed.",
        reason: "disposed",
      };
    }
    if (availability) return { ...availability } as NativeAudioAvailability;

    const loaded = options.loader.loadAudioEngine();
    if (!loaded.available) {
      availability = {
        available: false,
        diagnostic: loaded.diagnostic,
        reason: loaded.reason,
      };
      return { ...availability } as NativeAudioAvailability;
    }

    const module = asNativeAudioModule(loaded.module);
    if (!module) {
      availability = {
        available: false,
        diagnostic: "The loaded native audio module does not expose createNativeAudioPlayer().",
        reason: "invalid-native-module",
      };
      return { ...availability } as NativeAudioAvailability;
    }

    let engineInfo: { diagnostic: string; ready: boolean } | null;
    try {
      engineInfo = readNativeEngineInfo(module);
    } catch (error) {
      availability = {
        available: false,
        diagnostic: `The native audio module readiness check failed: ${describeError(error)}`,
        reason: "invalid-native-module",
      };
      return { ...availability } as NativeAudioAvailability;
    }
    if (engineInfo && !engineInfo.ready) {
      availability = {
        available: false,
        diagnostic: engineInfo.diagnostic,
        reason: "engine-not-ready",
      };
      return { ...availability } as NativeAudioAvailability;
    }

    try {
      const candidate = module.createNativeAudioPlayer();
      if (!isNativeAudioPlayer(candidate)) {
        availability = {
          available: false,
          diagnostic: "The native audio module exposed an incompatible player instance.",
          reason: "invalid-native-module",
        };
        return { ...availability } as NativeAudioAvailability;
      }
      player = candidate;
      player.onEvent(handleNativeEvent);
      snapshot = parseSnapshot(player.getSnapshot()) ?? cloneSnapshot(INITIAL_SNAPSHOT);
      availability = { available: true, modulePath: loaded.modulePath };
    } catch (error) {
      availability = {
        available: false,
        diagnostic: `The native audio player could not be created: ${describeError(error)}`,
        reason: "invalid-native-module",
      };
    }

    return { ...availability } as NativeAudioAvailability;
  }

  async function load(request: NativeAudioLoadRequest): Promise<NativeAudioOperationResult> {
    const validation = validateLoadRequest(request);
    if (validation) return rejected(validation);

    const activePlayer = requirePlayer();
    if (!activePlayer.ok) return activePlayer.result;

    // NAPI can publish a final callback from an older decoder while the next
    // async `load()` is still resolving. Drop all native callbacks in this tiny
    // hand-off window; the successful return below is the authoritative first
    // snapshot for the new Rust token and emits `loaded` itself.
    const requestRevision = ++nextLoadRequestRevision;
    activeLoadRequestRevision = requestRevision;
    snapshot = {
      ...snapshot,
      error: null,
      loadId: request.loadId,
      phase: "loading",
      positionMs: 0,
      token: null,
    };
    notify({ snapshot: cloneSnapshot(snapshot), type: "state-changed" });

    try {
      const result = parseSnapshot(
        await activePlayer.player.load({
          loadId: request.loadId,
          source:
            request.source.kind === "file"
              ? { kind: "file", value: request.source.path }
              : { kind: "https", value: request.source.url },
        }),
      );
      if (activeLoadRequestRevision !== requestRevision) return supersededLoad();
      if (!result || result.loadId !== request.loadId) {
        activeLoadRequestRevision = null;
        return rejected("The native audio player returned an invalid load snapshot.");
      }
      snapshot = result;
      activeLoadRequestRevision = null;
      notify({ snapshot: cloneSnapshot(snapshot), type: "loaded" });
      return accepted();
    } catch (error) {
      if (activeLoadRequestRevision !== requestRevision) return supersededLoad();
      activeLoadRequestRevision = null;
      return rejectFromNativeError(error, "source");
    }
  }

  async function play() {
    return invoke("play", (activePlayer) => activePlayer.play());
  }

  async function pause() {
    return invoke("pause", (activePlayer) => activePlayer.pause());
  }

  async function stop() {
    const result = await invoke("stop", (activePlayer) => activePlayer.stop());
    if (result.status === "accepted") {
      snapshot = {
        ...snapshot,
        error: null,
        phase: "stopped",
        positionMs: 0,
      };
    }
    return result;
  }

  async function seek(positionMs: number) {
    if (!Number.isFinite(positionMs) || positionMs < 0) {
      return rejected("positionMs must be a finite non-negative number.");
    }
    const activePlayer = requirePlayer();
    if (!activePlayer.ok) return activePlayer.result;
    try {
      const result = parseSnapshot(await activePlayer.player.seek(Math.floor(positionMs)));
      if (!result || result.loadId !== snapshot.loadId) {
        return rejected("The native audio player returned an invalid seek snapshot.");
      }
      snapshot = result;
      notify({ snapshot: cloneSnapshot(snapshot), type: "state-changed" });
      return accepted();
    } catch (error) {
      return rejectFromNativeError(error, "source");
    }
  }

  async function setVolume(volume: number) {
    if (!Number.isFinite(volume) || volume < 0 || volume > 1) {
      return rejected("volume must be a finite number between 0 and 1.");
    }
    const result = await invoke("setVolume", (activePlayer) => activePlayer.setVolume(volume));
    if (result.status === "accepted") snapshot = { ...snapshot, volume };
    return result;
  }

  async function invoke(
    operation: string,
    action: (activePlayer: NativeAudioPlayerPort) => void | Promise<void>,
  ): Promise<NativeAudioOperationResult> {
    const activePlayer = requirePlayer();
    if (!activePlayer.ok) return activePlayer.result;
    try {
      await action(activePlayer.player);
      const nextSnapshot = parseSnapshot(activePlayer.player.getSnapshot());
      if (nextSnapshot && belongsToActiveLoad(nextSnapshot)) snapshot = nextSnapshot;
      return accepted();
    } catch (error) {
      return rejectFromNativeError(error, operation === "play" ? "output" : "unknown");
    }
  }

  function getSnapshot() {
    if (!disposed && player && activeLoadRequestRevision === null) {
      try {
        const nextSnapshot = parseSnapshot(player.getSnapshot());
        if (nextSnapshot && belongsToActiveLoad(nextSnapshot)) snapshot = nextSnapshot;
      } catch {
        // A later command will turn a recoverable NAPI exception into a typed
        // operation result. Read-only snapshot callers retain the last known
        // safe state rather than unexpectedly crashing a tray or MCP request.
      }
    }
    return cloneSnapshot(snapshot);
  }

  function subscribe(listener: (event: NativeAudioEvent) => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  async function dispose() {
    if (disposed) return;
    disposed = true;
    const activePlayer = player;
    player = null;
    listeners.clear();
    if (!activePlayer) return;
    try {
      await activePlayer.dispose();
    } catch {
      // Process shutdown is best-effort. The host is already inert, and a
      // native disposal failure must not keep Electron alive.
    }
  }

  function handleNativeEvent(value: unknown) {
    if (disposed || activeLoadRequestRevision !== null) return;
    const event = parseNativeEvent(value);
    if (!event || !belongsToActiveLoad(event.snapshot)) return;
    snapshot = event.snapshot;
    notify(event);
  }

  function belongsToActiveLoad(candidate: NativeAudioSnapshot) {
    if (candidate.loadId === null) return snapshot.loadId === null;
    if (candidate.loadId !== snapshot.loadId) return false;
    // During the small NAPI load window token is not yet known. Once it is,
    // both session loadId and Rust load token must match.
    return snapshot.token === null || candidate.token === snapshot.token;
  }

  function requirePlayer():
    | { ok: true; player: NativeAudioPlayerPort }
    | { ok: false; result: NativeAudioOperationResult } {
    const status = getAvailability();
    if (status.available && player) return { ok: true, player };
    if (status.available) {
      return {
        ok: false,
        result: {
          diagnostic: "The native audio module is available but no player instance exists.",
          reason: "invalid-native-module",
          status: "unavailable",
        },
      };
    }
    return {
      ok: false,
      result: {
        diagnostic: status.diagnostic,
        reason: status.reason,
        status: "unavailable",
      },
    };
  }

  function accepted(): NativeAudioOperationResult {
    return { snapshot: cloneSnapshot(snapshot), status: "accepted" };
  }

  function rejected(diagnostic: string): NativeAudioOperationResult {
    return { diagnostic, reason: "invalid-input", status: "rejected" };
  }

  function supersededLoad(): NativeAudioOperationResult {
    return {
      diagnostic: "A newer native audio load replaced this request.",
      reason: "native-load-superseded",
      status: "unavailable",
    };
  }

  function rejectFromNativeError(
    error: unknown,
    fallbackKind: NativeAudioFailure["kind"],
  ): NativeAudioOperationResult {
    const failure = classifyNativeError(error, fallbackKind);
    snapshot = { ...snapshot, error: failure, phase: "error" };
    notify({
      snapshot: cloneSnapshot(snapshot),
      type: failure.kind === "output" ? "output-failed" : "source-error",
    });
    return { diagnostic: failure.message, reason: failure.kind, status: "rejected" };
  }

  function notify(event: NativeAudioEvent) {
    for (const listener of [...listeners]) {
      try {
        listener(event);
      } catch {
        // An observer (future IPC adapter, FFT bridge, or metrics sink) cannot
        // be allowed to destabilise the audio authority.
      }
    }
  }

  return {
    dispose,
    getAvailability,
    getSnapshot,
    load,
    pause,
    play,
    seek,
    setVolume,
    stop,
    subscribe,
  };
}

function asNativeAudioModule(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<{ createNativeAudioPlayer(): unknown }>;
  if (typeof candidate.createNativeAudioPlayer !== "function") return null;
  return candidate as {
    createNativeAudioPlayer(): unknown;
    getNativeAudioEngineInfo?(): unknown;
  };
}

function readNativeEngineInfo(module: {
  getNativeAudioEngineInfo?(): unknown;
}): { diagnostic: string; ready: boolean } | null {
  if (typeof module.getNativeAudioEngineInfo !== "function") return null;
  const value = module.getNativeAudioEngineInfo();
  if (!value || typeof value !== "object") {
    return {
      diagnostic: "The native audio module reported invalid engine readiness metadata.",
      ready: false,
    };
  }
  const candidate = value as { diagnostic?: unknown; ready?: unknown };
  if (typeof candidate.ready !== "boolean") {
    return {
      diagnostic: "The native audio module reported invalid engine readiness metadata.",
      ready: false,
    };
  }
  return {
    diagnostic:
      typeof candidate.diagnostic === "string"
        ? candidate.diagnostic
        : "Native audio engine is not ready.",
    ready: candidate.ready,
  };
}

function isNativeAudioPlayer(value: unknown): value is NativeAudioPlayerPort {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Record<keyof NativeAudioPlayerPort, unknown>>;
  return (
    typeof candidate.dispose === "function" &&
    typeof candidate.getSnapshot === "function" &&
    typeof candidate.load === "function" &&
    typeof candidate.onEvent === "function" &&
    typeof candidate.pause === "function" &&
    typeof candidate.play === "function" &&
    typeof candidate.seek === "function" &&
    typeof candidate.setVolume === "function" &&
    typeof candidate.stop === "function"
  );
}

function validateLoadRequest(request: NativeAudioLoadRequest) {
  if (!request.loadId || request.loadId.length > 128) {
    return "loadId must be a non-empty identifier no longer than 128 characters.";
  }
  if (request.source.kind === "file") {
    if (!isAbsoluteWindowsPath(request.source.path)) {
      return "Native file sources must use an absolute Windows path.";
    }
    return null;
  }
  try {
    const url = new URL(request.source.url);
    return url.protocol === "https:" ? null : "Native remote sources must use HTTPS.";
  } catch {
    return "Native remote sources must use a valid HTTPS URL.";
  }
}

function isAbsoluteWindowsPath(value: string) {
  return value.length > 0 && !value.includes("\0") && /^[a-zA-Z]:[\\/]/.test(value);
}

function parseNativeEvent(value: unknown): NativeAudioEvent | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as { snapshot?: unknown; type?: unknown };
  const snapshot = parseSnapshot(candidate.snapshot);
  if (!snapshot || typeof candidate.type !== "string") return null;
  switch (candidate.type) {
    case "ended":
    case "loaded":
    case "position":
      return { snapshot, type: candidate.type };
    case "stateChanged":
      return { snapshot, type: "state-changed" };
    case "sourceError":
      return { snapshot, type: "source-error" };
    case "outputFailed":
      return { snapshot, type: "output-failed" };
    default:
      return null;
  }
}

function parseSnapshot(value: unknown): NativeAudioSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  const loadId = candidate.loadId == null ? null : candidate.loadId;
  const token = candidate.token == null ? null : candidate.token;
  if (
    !isPhase(candidate.phase) ||
    !isNonNegativeNumber(candidate.positionMs) ||
    !isNonNegativeNumber(candidate.durationMs) ||
    !isVolume(candidate.volume) ||
    !(typeof loadId === "string" || loadId === null) ||
    !(isIntegerNumber(token) || token === null)
  ) {
    return null;
  }
  const error = parseFailure(candidate.error);
  // napi-rs omits `Option::None` fields instead of serializing JavaScript
  // null. Normalize both representations at this trust boundary.
  if (candidate.error != null && !error) return null;
  return {
    durationMs: candidate.durationMs,
    error,
    loadId,
    phase: candidate.phase,
    positionMs: candidate.positionMs,
    token,
    volume: candidate.volume,
  };
}

function parseFailure(value: unknown): NativeAudioFailure | null {
  if (value === null) return null;
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  if (
    !isFailureKind(candidate.kind) ||
    typeof candidate.message !== "string" ||
    typeof candidate.retryable !== "boolean"
  ) {
    return null;
  }
  return { kind: candidate.kind, message: candidate.message, retryable: candidate.retryable };
}

function classifyNativeError(
  error: unknown,
  fallbackKind: NativeAudioFailure["kind"],
): NativeAudioFailure {
  const message = describeError(error);
  const match = /^\[(source|decode|output|unknown)\]\s*(.*)$/i.exec(message);
  const kind = match?.[1]?.toLowerCase();
  return {
    kind: isFailureKind(kind) ? kind : fallbackKind,
    message: match?.[2] || message,
    retryable: kind !== "decode",
  };
}

function isFailureKind(value: unknown): value is NativeAudioFailure["kind"] {
  return value === "decode" || value === "output" || value === "source" || value === "unknown";
}

function isPhase(value: unknown): value is NativeAudioPhase {
  return (
    value === "ended" ||
    value === "error" ||
    value === "idle" ||
    value === "loading" ||
    value === "paused" ||
    value === "playing" ||
    value === "stopped"
  );
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isIntegerNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

function isVolume(value: unknown): value is number {
  return isNonNegativeNumber(value) && value <= 1;
}

function cloneSnapshot(value: NativeAudioSnapshot): NativeAudioSnapshot {
  return {
    ...value,
    error: value.error ? { ...value.error } : null,
  };
}

function describeError(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "Native audio operation failed.";
}
