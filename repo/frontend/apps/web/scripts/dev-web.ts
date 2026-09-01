import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import net from "node:net";
import { join } from "node:path";

function getProbeHost(host: string) {
  if (host === "0.0.0.0") {
    return "127.0.0.1";
  }

  if (host === "::") {
    return "::1";
  }

  return host;
}

function isPortOpen(host: string, port: number, timeoutMs = 300) {
  return new Promise<boolean>((resolve) => {
    const socket = net.createConnection({ host: getProbeHost(host), port });
    const finish = (isOpen: boolean) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(isOpen);
    };

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });
}

async function clearStaleNextDevLock(host: string, port: number) {
  // Keep this in sync with next.config.ts: development builds use an isolated
  // cache so they never compete with production build artifacts.
  const distDir = process.env.NEXT_DIST_DIR || ".next-dev";
  const lockPath = join(process.cwd(), distDir, "dev", "lock");
  if (!existsSync(lockPath)) {
    return;
  }

  if (await isPortOpen(host, port)) {
    console.error(
      `Next.js dev lock exists at ${lockPath}, and ${host}:${port} is already in use. ` +
        "Stop the running dev server before starting a new one.",
    );
    process.exit(1);
  }

  rmSync(lockPath, { force: true });
  console.warn(`Removed stale Next.js dev lock at ${lockPath}`);
}

async function main() {
  const port = Number(process.env.FRONTEND_PORT || 3000);
  const host = process.env.FRONTEND_HOST || "127.0.0.1";

  await clearStaleNextDevLock(host, port);

  console.log(`Starting Next.js on ${host}:${port}...`);

  const nextDev = spawn("bunx", ["next", "dev", "-H", host, "-p", port.toString()], {
    stdio: "inherit",
    shell: true,
  });

  nextDev.on("close", (code) => {
    process.exit(code || 0);
  });
}

void main();
