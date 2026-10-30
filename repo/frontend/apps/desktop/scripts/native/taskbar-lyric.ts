import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

import { runNapiBuild } from "../../lib/napiBuild";

if (process.platform !== "win32") process.exit(0);

const desktopRoot = join(import.meta.dir, "..", "..");
const moduleRoot = join(desktopRoot, "native", "taskbar-lyric");
const architectures = process.argv.includes("--all-arch")
  ? (["arm64", "x64"] as const)
  : ([process.arch === "arm64" ? "arm64" : "x64"] as const);

for (const arch of architectures) {
  const target = `${arch === "arm64" ? "aarch64" : "x86_64"}-pc-windows-msvc`;
  const binaryPath = join(moduleRoot, `scopify-taskbar-lyric.win32-${arch}-msvc.node`);

  const status = runNapiBuild({
    crateRoot: moduleRoot,
    cwd: desktopRoot,
    args: ["--platform", "--release", "--target", target, "--cwd", moduleRoot],
  });
  if (status !== 0) process.exit(status);
  if (!existsSync(binaryPath)) {
    throw new Error(`NAPI completed without producing ${binaryPath}`);
  }

  if (arch === process.arch) {
    const nativeModule = createRequire(import.meta.url)(binaryPath) as Record<string, unknown>;
    const expectedExports = [
      "RegistryWatcher",
      "TaskbarCreatedWatcher",
      "TaskbarService",
      "TrayWatcher",
      "UiaWatcher",
    ];
    const missing = expectedExports.filter((name) => typeof nativeModule[name] !== "function");
    if (missing.length > 0) {
      throw new Error(`The taskbar lyric artifact is missing NAPI exports: ${missing.join(", ")}`);
    }
  }
}
