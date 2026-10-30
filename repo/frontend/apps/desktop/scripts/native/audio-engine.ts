import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

import { runNapiBuild } from "../../lib/napiBuild";

// The desktop package intentionally invokes this only from Windows build
// scripts. Keeping the guard here also makes `bun run build` on a non-Windows
// contributor machine safe: the optional Windows binary is not required for
// Web work or for the HTML-audio Desktop fallback.
if (process.platform !== "win32") process.exit(0);

const desktopRoot = join(import.meta.dir, "..", "..");
const engineRoot = join(desktopRoot, "native", "audio-engine");
const declarationPath = join(engineRoot, "index.d.ts");
const architectures = process.argv.includes("--all-arch")
  ? (["arm64", "x64"] as const)
  : ([process.arch === "arm64" ? "arm64" : "x64"] as const);

for (const arch of architectures) {
  const target = `${arch === "arm64" ? "aarch64" : "x86_64"}-pc-windows-msvc`;
  const binaryPath = join(engineRoot, `scopify-audio-engine.win32-${arch}-msvc.node`);

  const status = runNapiBuild({
    crateRoot: engineRoot,
    cwd: desktopRoot,
    args: ["--platform", "--release", "--target", target, "--cwd", engineRoot],
  });
  if (status !== 0) process.exit(status);

  if (!existsSync(binaryPath)) {
    throw new Error(`NAPI completed without producing ${binaryPath}`);
  }

  if (arch === process.arch) {
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
  }
}

if (!existsSync(declarationPath)) {
  throw new Error(`NAPI completed without generating ${declarationPath}`);
}
