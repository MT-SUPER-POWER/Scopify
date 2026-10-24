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
  loadTaskbarLyric(): NativeModuleLoadResult;
  resolveAudioEnginePaths(): string[];
  resolveTaskbarLyricPaths(): string[];
}

export interface NativeModuleLoaderOptions {
  context(): NativeModulePathContext;
  /** Injectable for tests; production uses Node's CommonJS loader for `.node`. */
  loadModule?(modulePath: string): unknown;
}
