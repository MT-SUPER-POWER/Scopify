import {
  createServer,
  type IncomingHttpHeaders,
  type IncomingMessage,
  type Server,
} from "node:http";

import type { McpEndpoint } from "./endpoint";
import type { McpCredentialStore } from "./credentialStore";

export interface McpHttpServer {
  close(): Promise<void>;
  listen(port: number): Promise<number>;
}

export interface CreateMcpHttpServerOptions {
  credentials: McpCredentialStore;
  endpoint: McpEndpoint;
  maximumBodyBytes?: number;
}

const DEFAULT_MAXIMUM_BODY_BYTES = 1_048_576;
const MCP_PATH = "/mcp";

/**
 * The loopback-only HTTP adapter. It authenticates and rejects hostile browser
 * origins before requests reach the MCP protocol endpoint. Node HTTP is used
 * instead of an extra framework because the host only needs this one route.
 */
export function createMcpHttpServer(options: CreateMcpHttpServerOptions): McpHttpServer {
  const maximumBodyBytes = options.maximumBodyBytes ?? DEFAULT_MAXIMUM_BODY_BYTES;
  if (!Number.isInteger(maximumBodyBytes) || maximumBodyBytes <= 0) {
    throw new RangeError("maximumBodyBytes must be a positive integer.");
  }

  const server = createServer(async (request, response) => {
    try {
      if (!isMcpRequestPath(request.url)) {
        sendJson(response, 404, { error: "MCP endpoint not found" });
        return;
      }
      if (!isAllowedHost(request.headers.host)) {
        sendJson(response, 403, { error: "MCP Host header is not allowed" });
        return;
      }
      if (!isAllowedOrigin(request.headers.origin)) {
        sendJson(response, 403, { error: "MCP Origin is not allowed" });
        return;
      }
      if (request.method === "POST" && !isJsonContentType(request.headers["content-type"])) {
        sendJson(response, 415, { error: "MCP POST requests must use application/json" });
        return;
      }

      const token = bearerToken(request.headers.authorization);
      if (!(await options.credentials.verify(token))) {
        sendJson(response, 401, { error: "MCP authentication failed" });
        return;
      }

      const body = await readBody(request, maximumBodyBytes);
      const endpointRequest = toWebRequest(request, body);
      const endpointResponse = await options.endpoint.handle(endpointRequest);
      await writeWebResponse(response, endpointResponse);
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) {
        sendJson(response, 413, { error: "MCP request body is too large" });
        return;
      }
      sendJson(response, 500, { error: "MCP server failed to process the request" });
    }
  });

  return {
    async close() {
      if (!server.listening) return;
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    },
    async listen(port) {
      await listenOnLoopback(server, port);
      const address = server.address();
      if (!address || typeof address === "string") {
        throw new Error("MCP server did not expose a TCP listening address.");
      }
      return address.port;
    },
  };
}

function listenOnLoopback(server: Server, port: number) {
  return new Promise<void>((resolve, reject) => {
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    const onListening = () => {
      cleanup();
      resolve();
    };
    const cleanup = () => {
      server.removeListener("error", onError);
      server.removeListener("listening", onListening);
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen({ host: "127.0.0.1", port });
  });
}

function isMcpRequestPath(rawUrl: string | undefined) {
  if (!rawUrl) return false;
  try {
    return new URL(rawUrl, "http://127.0.0.1").pathname === MCP_PATH;
  } catch {
    return false;
  }
}

/** Reject DNS-rebinding attempts: only conventional local Host names are valid. */
function isAllowedHost(host: string | undefined) {
  if (!host) return false;
  const normalized = host.toLowerCase();
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    /^localhost:\\d+$/.test(normalized) ||
    /^127\.0\.0\.1:\d+$/.test(normalized)
  );
}

/** Non-browser MCP clients generally send no Origin. Browser origins must be local. */
function isAllowedOrigin(origin: string | undefined) {
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    return (
      parsed.protocol === "http:" &&
      (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")
    );
  } catch {
    return false;
  }
}

function isJsonContentType(value: string | string[] | undefined) {
  const contentType = Array.isArray(value) ? value[0] : value;
  return contentType?.toLowerCase().startsWith("application/json") ?? false;
}

function bearerToken(value: string | undefined) {
  const match = /^Bearer ([A-Za-z0-9_-]+)$/.exec(value ?? "");
  return match?.[1] ?? null;
}

async function readBody(request: IncomingMessage, maximumBodyBytes: number) {
  const chunks: Buffer[] = [];
  let length = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    length += buffer.length;
    if (length > maximumBodyBytes) throw new RequestBodyTooLargeError();
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
}

function toWebRequest(request: IncomingMessage, body: Buffer) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers as IncomingHttpHeaders)) {
    if (value === undefined) continue;
    headers.set(name, Array.isArray(value) ? value.join(", ") : value);
  }

  const method = request.method ?? "GET";
  return new Request(`http://${request.headers.host ?? "127.0.0.1"}${request.url ?? MCP_PATH}`, {
    // MCP request bodies are JSON. Passing text also avoids Node Buffer's
    // SharedArrayBuffer-compatible generic leaking into the DOM BodyInit type.
    body: body.length > 0 ? body.toString("utf8") : undefined,
    headers,
    method,
  });
}

async function writeWebResponse(response: import("node:http").ServerResponse, source: Response) {
  source.headers.forEach((value, name) => response.setHeader(name, value));
  response.statusCode = source.status;
  response.end(Buffer.from(await source.arrayBuffer()));
}

function sendJson(response: import("node:http").ServerResponse, status: number, payload: unknown) {
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

class RequestBodyTooLargeError extends Error {}
