import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

// 任务栏歌词只在 Windows 上存在；其他平台直接跳过，保证非 Windows 机器上的构建不受影响。
if (process.platform !== "win32") process.exit(0);

const moduleRoot = join(import.meta.dir, "..", "native", "taskbar-lyric");
const arch = process.arch === "arm64" ? "arm64" : "x64";
const binaryPath = join(moduleRoot, `scopify-taskbar-lyric.win32-${arch}-msvc.node`);

function cleanStaleTransactions() {
  try {
    for (const file of readdirSync(moduleRoot)) {
      if (file.startsWith(".napi-rs-filesystem-transaction")) {
        rmSync(join(moduleRoot, file), { recursive: true, force: true });
      }
    }
  } catch {}
}

// 从 desktop 包目录调用 napi（@napi-rs/cli 装在这里），用 --cwd 指向 crate。
function runNapiBuild() {
  return spawnSync(
    "pnpm",
    ["exec", "napi", "build", "--platform", "--release", "--cwd", moduleRoot],
    {
      cwd: join(import.meta.dir, ".."),
      shell: process.platform === "win32",
      encoding: "utf8",
      stdio: "inherit",
      windowsHide: true,
    },
  );
}

cleanStaleTransactions();
let result = runNapiBuild();
if (result.status !== 0) {
  // 杀毒软件或索引服务可能短暂占用 NAPI 的 .swp 暂存文件，清理后重试一次。
  cleanStaleTransactions();
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 600);
  result = runNapiBuild();
}

if (result.error) {
  throw new Error(`Unable to start @napi-rs/cli (${result.error.message}).`);
}
if (result.status !== 0) process.exit(result.status ?? 1);
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
