import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

import { runNapiBuild } from "../lib/napiBuild";

// The desktop package intentionally invokes this only from Windows build
// scripts. Keeping the guard here also makes `bun run build` on a non-Windows
// contributor machine safe: the optional Windows binary is not required for
// Web work or for the HTML-audio Desktop fallback.
if (process.platform !== "win32") process.exit(0);

const engineRoot = join(import.meta.dir, "..", "native", "audio-engine");
const arch = process.arch === "arm64" ? "arm64" : "x64";
const binaryPath = join(engineRoot, `scopify-audio-engine.win32-${arch}-msvc.node`);
const declarationPath = join(engineRoot, "index.d.ts");

/**
 * `napi build` both builds the Node-API binary and generates index.d.ts from
 * the Rust annotations. Do not replace this with a handwritten declaration:
 * the generated declaration is what keeps the Main host and Rust ABI honest.
 */
const status = runNapiBuild({
  crateRoot: engineRoot,
  cwd: engineRoot,
  args: ["--platform", "--release"],
});
if (status !== 0) process.exit(status);

if (!existsSync(binaryPath)) {
  throw new Error(`NAPI completed without producing ${binaryPath}`);
}
if (!existsSync(declarationPath)) {
  throw new Error(`NAPI completed without generating ${declarationPath}`);
}

// Load the exact release artifact that packaging will copy. This catches an
// ABI/name mismatch that Cargo tests and a static electron-builder filter
// cannot detect, without opening the system audio device or playing sound.
const nativeModule = createRequire(import.meta.url)(binaryPath) as Record<string, unknown>;
if (
  typeof nativeModule.getNativeAudioEngineInfo !== "function" ||
  typeof nativeModule.createNativeAudioPlayer !== "function"
) {
  throw new Error("The native audio release artifact does not expose the expected NAPI ABI.");
}
const engineInfo = nativeModule.getNativeAudioEngineInfo() as { ready?: unknown };
if (engineInfo.ready !== true) {
  throw new Error("The native audio release artifact did not report a ready engine.");
}
const player = nativeModule.createNativeAudioPlayer() as {
  dispose?: () => void;
  getSnapshot?: () => unknown;
};
try {
  if (typeof player.getSnapshot !== "function" || typeof player.dispose !== "function") {
    throw new Error("The native audio release artifact returned an incompatible player ABI.");
  }
  const snapshot = player.getSnapshot();
  if (!snapshot || typeof snapshot !== "object" || !("phase" in snapshot)) {
    throw new Error("The native audio release artifact returned an invalid initial snapshot.");
  }
} finally {
  player.dispose?.();
}
