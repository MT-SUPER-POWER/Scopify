import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

if (process.platform !== "win32") process.exit(0);

const helperRoot = join(import.meta.dir, "..", "native", "wallpaper-helper");
const manifestPath = join(helperRoot, "Cargo.toml");
const result = spawnSync("cargo", ["build", "--release", "--manifest-path", manifestPath], {
  cwd: helperRoot,
  encoding: "utf8",
  stdio: "inherit",
  windowsHide: true,
});

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

const executablePath = join(helperRoot, "target", "release", "scopify-wallpaper-helper.exe");
if (!existsSync(executablePath)) {
  throw new Error(`Cargo completed without producing ${executablePath}`);
}
