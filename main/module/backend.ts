// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { spawn, ChildProcess } from "child_process";
import fs from "fs";
import { logger, __backendDir, __backendEntry, __backendEnv, appConfig } from "../constants.js";


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CONSTANT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let backendProcess: ChildProcess | null = null;
let backendUrl: string | undefined = process.env.BACKEND_URL;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


export function ensureBackendUrl() {
  if (backendUrl) return backendUrl;
  backendUrl = `http://${appConfig.backend.host}:${appConfig.backend.port}`;
  return backendUrl;
}

export function startManagedBackend() {
  // 如果配置禁用 or 已指定外部后端则不启动
  if (!appConfig.backend.autoStart || process.env.BACKEND_URL) {
    logger.info("[backend] use external or disabled:", process.env.BACKEND_URL ?? "disabled");
    backendUrl = process.env.BACKEND_URL;
    return;
  }

  if (!fs.existsSync(__backendEntry)) {
    logger.error("[backend] entry not found:", __backendEntry);
    throw new Error(`[backend] entry not found: ${__backendEntry}`);
  }

  logger.info(`[backend] starting ${__backendEntry} on ${__backendEnv.HOST}:${__backendEnv.PORT}`);
  backendProcess = spawn(process.execPath, [__backendEntry], {
    cwd: __backendDir,
    env: __backendEnv as NodeJS.ProcessEnv,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"]
  });

  logger.info(`[backend] Process initialized with PID: ${backendProcess.pid}`);

  backendProcess!.stdout?.on("data", (d) => logger.info("[backend:stdout]", d.toString().trim()));
  backendProcess!.stderr?.on("data", (d) => logger.error("[backend:stderr]", d.toString().trim()));
  backendProcess!.on("exit", (code) => {
    logger.error("[backend:exit]", `exited with code ${code}`);
  });
  backendProcess!.on("error", (err) => {
    logger.error("[backend:error]", err.message);
  });

  backendUrl = ensureBackendUrl();
}

export function stopManagedBackend() {
  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill();
    backendProcess = null;
  }
}

export { backendUrl, backendProcess };
