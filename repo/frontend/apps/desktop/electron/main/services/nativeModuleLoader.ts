import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Main-process-only native module loader.
 *
 * electron-vite must never try to bundle a `.node` binary. Keeping the path
 * policy here gives every native capability the same development/packaged
 * lookup behaviour and, importantly, lets a missing optional binary degrade
 * to an unavailable capability instead of preventing Electron from starting.
 */

export type NativeModuleUnavailableReason =
  "module-load-failed" | "module-missing" | "platform-unsupported";

export type NativeModuleLoadResult =
  | {
      available: true;
      module: unknown;
      modulePath: string;
    }
  | {
      available: false;
      diagnostic: string;
      reason: NativeModuleUnavailableReason;
    };

export interface NativeModulePathContext {
  appPath: string;
  arch: NodeJS.Architecture;
  isPackaged: boolean;
  platform: NodeJS.Platform;
  resourcesPath: string;
}

export interface NativeModuleLoader {
  loadAudioEngine(): NativeModuleLoadResult;
  resolveAudioEnginePaths(): string[];
}

export interface NativeModuleLoaderOptions {
  context(): NativeModulePathContext;
  /** Injectable for tests; production uses Node's CommonJS loader for `.node`. */
  loadModule?(modulePath: string): unknown;
}

const AUDIO_ENGINE_OVERRIDE_ENV = "SCOPIFY_AUDIO_ENGINE_PATH";
const AUDIO_ENGINE_PACKAGE_NAME = "scopify-audio-engine";

/**
 * Creates a lazy loader for optional NAPI modules. Do not call this from a
 * Renderer or Preload process: the returned module has unrestricted native
 * process access and is deliberately only consumed by Main capabilities.
 */
export function createNativeModuleLoader(options: NativeModuleLoaderOptions): NativeModuleLoader {
  const loadModule = options.loadModule ?? createRequire(import.meta.url);

  function resolveAudioEnginePaths() {
    const context = options.context();
    if (context.platform !== "win32") return [];

    const override = process.env[AUDIO_ENGINE_OVERRIDE_ENV]?.trim();
    if (override) return [override];

    const target = `win32-${context.arch}-msvc`;
    const binaryName = `${AUDIO_ENGINE_PACKAGE_NAME}.${target}.node`;

    if (context.isPackaged) {
      return [
        join(context.resourcesPath, "native", "audio-engine", binaryName),
        // This fallback makes development artifacts copied verbatim by an
        // older packager diagnosable while the package layout is migrated.
        join(context.resourcesPath, "native", "audio-engine", `${AUDIO_ENGINE_PACKAGE_NAME}.node`),
      ];
    }

    return [
      join(context.appPath, "native", "audio-engine", binaryName),
      join(context.appPath, "native", "audio-engine", `${AUDIO_ENGINE_PACKAGE_NAME}.node`),
    ];
  }

  function loadAudioEngine(): NativeModuleLoadResult {
    const context = options.context();
    if (context.platform !== "win32") {
      return {
        available: false,
        diagnostic: "Native audio is currently available only on Windows.",
        reason: "platform-unsupported",
      };
    }

    const candidates = resolveAudioEnginePaths();
    const modulePath = candidates.find((candidate) => existsSync(candidate));
    if (!modulePath) {
      return {
        available: false,
        diagnostic: "The optional native audio module was not found in this application build.",
        reason: "module-missing",
      };
    }

    try {
      return {
        available: true,
        module: loadModule(modulePath),
        modulePath,
      };
    } catch (error) {
      return {
        available: false,
        diagnostic: `The native audio module could not be loaded: ${describeError(error)}`,
        reason: "module-load-failed",
      };
    }
  }

  return { loadAudioEngine, resolveAudioEnginePaths };
}

function describeError(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "unknown loader error";
}
