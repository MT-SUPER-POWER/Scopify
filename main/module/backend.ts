import axios from "axios";
import { spawn, ChildProcess } from "child_process";
import fs from "fs";
import type { BackendStartupStatus } from "@/types/backend";
import { logger, __backendDir, __backendEntry, __backendEnv, appConfig } from "../constants.js";

let backendProcess: ChildProcess | null = null;
let backendUrl: string | undefined = process.env.BACKEND_URL;
let backendStartupPromise: Promise<BackendStartupStatus> | null = null;
let backendStartupStatus: BackendStartupStatus = {
  state: "starting",
  ready: false,
  url: `http://${appConfig.backend.host}:${appConfig.backend.port}`,
};

const BACKEND_READY_TIMEOUT_MS = 20_000;
const BACKEND_READY_INTERVAL_MS = 500;

export function ensureBackendUrl() {
  if (backendUrl) return backendUrl;
  backendUrl = `http://${appConfig.backend.host}:${appConfig.backend.port}`;
  return backendUrl;
}

function setBackendStartupStatus(next: Partial<BackendStartupStatus>) {
  backendStartupStatus = {
    ...backendStartupStatus,
    ...next,
    url: next.url ?? ensureBackendUrl(),
  };
  backendStartupStatus.ready = backendStartupStatus.state === "ready";
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForBackendReady(
  url: string,
  timeout = BACKEND_READY_TIMEOUT_MS,
  interval = BACKEND_READY_INTERVAL_MS,
) {
  const startedAt = Date.now();
  const retryableCodes = ["ECONNREFUSED", "ECONNRESET", "ECONNABORTED", "ETIMEDOUT"];

  while (Date.now() - startedAt < timeout) {
    const exitCode = backendProcess?.exitCode;
    if (exitCode !== null && exitCode !== undefined) {
      throw new Error(`[backend] exited before ready (code ${exitCode})`);
    }

    try {
      await axios.get(url, {
        timeout: interval,
        validateStatus: () => true,
      });
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException | undefined)?.code;
      if (code && !retryableCodes.includes(code)) {
        logger.warn("[backend] readiness probe retrying after unexpected error:", code);
      }
    }

    await sleep(interval);
  }

  throw new Error(`[backend] did not become ready within ${timeout}ms`);
}

export function getBackendStartupStatus() {
  return {
    ...backendStartupStatus,
    url: ensureBackendUrl(),
  };
}

export function startManagedBackend() {
  if (backendStartupPromise) {
    return backendStartupPromise;
  }

  backendStartupPromise = (async () => {
    const url = ensureBackendUrl();
    setBackendStartupStatus({
      state: "starting",
      ready: false,
      url,
      message: undefined,
    });

    if (!appConfig.backend.autoStart || process.env.BACKEND_URL) {
      logger.info("[backend] use external or disabled:", process.env.BACKEND_URL ?? "disabled");
      backendUrl = process.env.BACKEND_URL;
    } else {
      if (!fs.existsSync(__backendEntry)) {
        logger.error("[backend] entry not found:", __backendEntry);
        throw new Error(`[backend] entry not found: ${__backendEntry}`);
      }

      logger.info(`[backend] starting ${__backendEntry} on ${__backendEnv.HOST}:${__backendEnv.PORT}`);
      backendProcess = spawn(process.execPath, [__backendEntry], {
        cwd: __backendDir,
        env: __backendEnv as NodeJS.ProcessEnv,
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      });

      logger.info(`[backend] Process initialized with PID: ${backendProcess.pid}`);

      backendProcess.stdout?.on("data", (d) => logger.info("[backend:stdout]", d.toString().trim()));
      backendProcess.stderr?.on("data", (d) => logger.error("[backend:stderr]", d.toString().trim()));
      backendProcess.on("exit", (code) => {
        logger.error("[backend:exit]", `exited with code ${code}`);
      });
      backendProcess.on("error", (err) => {
        logger.error("[backend:error]", err.message);
      });
    }

    await waitForBackendReady(url);
    logger.info(`[backend] ready at ${url}`);
    setBackendStartupStatus({
      state: "ready",
      ready: true,
      url,
      message: undefined,
    });
    return getBackendStartupStatus();
  })().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    setBackendStartupStatus({
      state: "failed",
      ready: false,
      message,
    });
    logger.error("[backend] startup failed:", message);
    throw error;
  });

  return backendStartupPromise;
}

export function stopManagedBackend() {
  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill();
    backendProcess = null;
  }
}

export { backendUrl, backendProcess };
