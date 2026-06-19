import { spawn } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import net from "node:net";
import { join } from "node:path";
import yaml from "js-yaml";

const configPath = join(process.cwd(), "config", "app.config.yml");
const defaultPath = join(process.cwd(), "config", "app.config.default.yml");

function loadConfig() {
  try {
    const raw = readFileSync(existsSync(configPath) ? configPath : defaultPath, "utf-8");
    return yaml.load(raw) as any;
  } catch (e) {
    console.error("Failed to load config, using default port 3232", e);
    return { frontend: { devPort: 3232 } };
  }
}

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
  const lockPath = join(process.cwd(), "renderer", "dev", "lock");
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
  const config = loadConfig();
  const port = Number(process.env.FRONTEND_PORT || config.frontend?.devPort || 3232);
  const host = process.env.FRONTEND_HOST || config.frontend?.host || "127.0.0.1";

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
