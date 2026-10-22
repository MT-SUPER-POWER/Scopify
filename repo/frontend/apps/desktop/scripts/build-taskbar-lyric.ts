import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

import { runNapiBuild } from "../lib/napiBuild";

// 任务栏歌词只在 Windows 上存在；其他平台直接跳过，保证非 Windows 机器上的构建不受影响。
if (process.platform !== "win32") process.exit(0);

const moduleRoot = join(import.meta.dir, "..", "native", "taskbar-lyric");
const arch = process.arch === "arm64" ? "arm64" : "x64";
const binaryPath = join(moduleRoot, `scopify-taskbar-lyric.win32-${arch}-msvc.node`);

// 从 desktop 包目录调用 napi（@napi-rs/cli 装在这里），用 --cwd 指向 crate。
const status = runNapiBuild({
  crateRoot: moduleRoot,
  cwd: join(import.meta.dir, ".."),
  args: ["--platform", "--release", "--cwd", moduleRoot],
});
if (status !== 0) process.exit(status);
if (!existsSync(binaryPath)) {
  throw new Error(`NAPI completed without producing ${binaryPath}`);
}

// 只校验导出的类是否齐全，不实例化：实例化会真的去改动当前机器的任务栏。
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
