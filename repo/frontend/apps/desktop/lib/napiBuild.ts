import { spawnSync } from "node:child_process";
import { readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [800, 2000];

/** napi 提交产物时会把暂存目录整体 rename；Windows 下杀毒软件/索引服务扫描新 .node 时会短暂占用，导致 EPERM。 */
const TRANSIENT_LOCK_PATTERN = /\b(EPERM|EBUSY|EACCES)\b[\s\S]*\.napi-rs-filesystem-transaction/;

export interface NapiBuildOptions {
  /** 被构建的 crate 目录，用于清理残留的 napi 事务暂存区。 */
  crateRoot: string;
  /** 运行 `pnpm exec napi` 的目录（需能解析到 @napi-rs/cli）。 */
  cwd: string;
  args: string[];
}

function cleanStaleTransactions(crateRoot: string) {
  try {
    for (const file of readdirSync(crateRoot)) {
      if (file.startsWith(".napi-rs-filesystem-transaction")) {
        rmSync(join(crateRoot, file), { recursive: true, force: true });
      }
    }
  } catch {}
}

function sleep(ms: number) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/**
 * 运行 `napi build`，遇到 Windows 瞬时文件占用时静默重试。
 * 每次尝试的输出先缓存：成功或遇到非瞬时错误时才原样打印，避免已被重试消化的 EPERM 堆栈混进构建日志。
 */
export function runNapiBuild({ crateRoot, cwd, args }: NapiBuildOptions): number {
  cleanStaleTransactions(crateRoot);

  for (let attempt = 1; ; attempt += 1) {
    const result = spawnSync("pnpm", ["exec", "napi", "build", ...args], {
      cwd,
      shell: process.platform === "win32",
      encoding: "utf8",
      stdio: ["inherit", "pipe", "pipe"],
      windowsHide: true,
    });

    if (result.error) {
      throw new Error(`Unable to start @napi-rs/cli (${result.error.message}).`);
    }

    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
    const transient = result.status !== 0 && TRANSIENT_LOCK_PATTERN.test(output);

    if (!transient || attempt >= MAX_ATTEMPTS) {
      process.stdout.write(result.stdout ?? "");
      process.stderr.write(result.stderr ?? "");
      return result.status ?? 1;
    }

    console.warn(
      `napi build hit a transient file lock in ${crateRoot}; retrying (${attempt}/${MAX_ATTEMPTS - 1})...`,
    );
    cleanStaleTransactions(crateRoot);
    sleep(RETRY_DELAYS_MS[attempt - 1] ?? 2000);
  }
}
