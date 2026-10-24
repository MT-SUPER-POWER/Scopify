import type {
  NativeModuleLoadResult,
  NativeModuleLoader,
  NativeModuleLoaderOptions,
} from "@/types/service/nativeModules/loader";
export type {
  NativeModuleUnavailableReason,
  NativeModuleLoadResult,
  NativeModulePathContext,
  NativeModuleLoader,
  NativeModuleLoaderOptions,
} from "@/types/service/nativeModules/loader";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { join } from "node:path";

const AUDIO_ENGINE_OVERRIDE_ENV = "SCOPIFY_AUDIO_ENGINE_PATH";
const AUDIO_ENGINE_PACKAGE_NAME = "scopify-audio-engine";
const TASKBAR_LYRIC_OVERRIDE_ENV = "SCOPIFY_TASKBAR_LYRIC_PATH";
const TASKBAR_LYRIC_PACKAGE_NAME = "scopify-taskbar-lyric";

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

  function resolveTaskbarLyricPaths() {
    const context = options.context();
    if (context.platform !== "win32") return [];

    const override = process.env[TASKBAR_LYRIC_OVERRIDE_ENV]?.trim();
    if (override) return [override];

    const binaryName = `${TASKBAR_LYRIC_PACKAGE_NAME}.win32-${context.arch}-msvc.node`;
    const root = context.isPackaged ? context.resourcesPath : context.appPath;
    return [join(root, "native", "taskbar-lyric", binaryName)];
  }

  function loadTaskbarLyric(): NativeModuleLoadResult {
    const context = options.context();
    if (context.platform !== "win32") {
      return {
        available: false,
        diagnostic: "Taskbar lyrics are available only on Windows.",
        reason: "platform-unsupported",
      };
    }

    const modulePath = resolveTaskbarLyricPaths().find((candidate) => existsSync(candidate));
    if (!modulePath) {
      return {
        available: false,
        diagnostic:
          "The taskbar lyric module was not found. Run `pnpm --filter @scopify/desktop run taskbar:build`.",
        reason: "module-missing",
      };
    }

    try {
      return { available: true, module: loadModule(modulePath), modulePath };
    } catch (error) {
      return {
        available: false,
        diagnostic: `The taskbar lyric module could not be loaded: ${describeError(error)}`,
        reason: "module-load-failed",
      };
    }
  }

  return { loadAudioEngine, loadTaskbarLyric, resolveAudioEnginePaths, resolveTaskbarLyricPaths };
}

function describeError(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "unknown loader error";
}
