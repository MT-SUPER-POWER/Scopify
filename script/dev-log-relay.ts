import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  unlinkSync,
} from "node:fs";
import { join } from "node:path";

import yaml from "js-yaml";

import { toLogValue } from "../lib/web/logger";
import {
  RENDERER_LOG_LEVELS,
  RENDERER_LOG_SOURCES,
  type LogMetadata,
  type RendererLogEvent,
  type RendererLogLevel,
  type RendererLogSource,
} from "../types/logging";

const MAX_BODY_BYTES = 64 * 1024;
const logDir = join(process.cwd(), "logs", "web");

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isRendererLogLevel(value: unknown): value is RendererLogLevel {
  return typeof value === "string" && RENDERER_LOG_LEVELS.includes(value as RendererLogLevel);
}

function isRendererLogSource(value: unknown): value is RendererLogSource {
  return typeof value === "string" && RENDERER_LOG_SOURCES.includes(value as RendererLogSource);
}

function toMetadata(value: unknown): LogMetadata {
  const normalized = toLogValue(value);
  if (typeof normalized === "object" && normalized !== null && !Array.isArray(normalized)) {
    return normalized;
  }
  return { value: normalized };
}

function toSafeString(value: string) {
  const normalized = toLogValue(value);
  return typeof normalized === "string" ? normalized : String(normalized);
}

function isRendererLogEvent(value: unknown): value is RendererLogEvent {
  if (!isRecord(value) || !isRendererLogLevel(value.level) || typeof value.message !== "string") {
    return false;
  }
  return value.source === undefined || isRendererLogSource(value.source);
}

function getArg(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function getKeepDays() {
  const configPath = join(process.cwd(), "config", "app.config.yml");
  const defaultPath = join(process.cwd(), "config", "app.config.default.yml");
  const source = existsSync(configPath) ? configPath : defaultPath;

  try {
    const parsed = yaml.load(readFileSync(source, "utf-8"));
    if (!isRecord(parsed) || !isRecord(parsed.logging)) return 7;
    const keepDays = parsed.logging.keepDays;
    return typeof keepDays === "number" && keepDays > 0 ? keepDays : 7;
  } catch {
    return 7;
  }
}

function getLogPath(timestamp: string) {
  const date = timestamp.slice(0, 10) || new Date().toISOString().slice(0, 10);
  return join(logDir, `${date}.log`);
}

function cleanOldLogs() {
  if (!existsSync(logDir)) return;
  const cutoff = Date.now() - getKeepDays() * 24 * 60 * 60 * 1_000;
  for (const file of readdirSync(logDir)) {
    const filePath = join(logDir, file);
    if (statSync(filePath).mtimeMs < cutoff) unlinkSync(filePath);
  }
}

function writeEvent(event: RendererLogEvent) {
  const normalized: RendererLogEvent = {
    ...event,
    ...(event.event ? { event: toSafeString(event.event) } : {}),
    ...(event.id ? { id: toSafeString(event.id) } : {}),
    message: toSafeString(event.message),
    ...(event.metadata ? { metadata: toMetadata(event.metadata) } : {}),
    timestamp: event.timestamp ?? new Date().toISOString(),
    ...(event.traceId ? { traceId: toSafeString(event.traceId) } : {}),
  };
  const source = normalized.source ?? "app";
  const line = JSON.stringify(normalized);
  mkdirSync(logDir, { recursive: true });
  appendFileSync(getLogPath(normalized.timestamp ?? new Date().toISOString()), `${line}\n`, "utf-8");

  const prefix = `[web:${source}]`;
  if (normalized.level === "debug") console.debug(prefix, normalized.message, normalized.metadata);
  else if (normalized.level === "info") console.info(prefix, normalized.message, normalized.metadata);
  else if (normalized.level === "warn") console.warn(prefix, normalized.message, normalized.metadata);
  else console.error(prefix, normalized.message, normalized.metadata);
}

function reply(response: ServerResponse, status: number) {
  response.writeHead(status, {
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-origin": "*",
    "content-type": "application/json",
  });
  response.end(status === 204 ? undefined : JSON.stringify({ ok: status < 400 }));
}

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("Log payload exceeds the development relay size limit."));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    request.on("error", reject);
  });
}

async function handleRequest(request: IncomingMessage, response: ServerResponse) {
  if (request.method === "OPTIONS") {
    reply(response, 204);
    return;
  }
  if (request.method !== "POST" || request.url !== "/events") {
    reply(response, 404);
    return;
  }

  try {
    const parsed = JSON.parse(await readBody(request)) as unknown;
    if (!isRendererLogEvent(parsed)) {
      reply(response, 400);
      return;
    }
    writeEvent(parsed);
    reply(response, 202);
  } catch (error) {
    console.error("[web-log-relay] failed to accept renderer event", error);
    reply(response, 400);
  }
}

const host = getArg("--host") ?? "127.0.0.1";
const port = Number(getArg("--port") ?? 3_001);
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error("--port must be an integer from 1 to 65535.");
}

cleanOldLogs();
const server = createServer((request, response) => {
  void handleRequest(request, response);
});
server.listen(port, host, () => {
  console.log(`[web-log-relay] listening on http://${host}:${port}/events`);
  console.log(`[web-log-relay] writing renderer events to ${logDir}`);
});
server.on("error", (error) => {
  console.error("[web-log-relay] failed to start", error);
  process.exitCode = 1;
});
