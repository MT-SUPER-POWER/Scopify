import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { app, safeStorage } from "electron";

import {
  createMcpCredentialStore,
  type McpCredentialPersistence,
  type McpCredentialStore,
} from "./credentialStore";

const CREDENTIAL_FILE_NAME = "mcp-credential.bin";

/**
 * Creates the production credential store. Electron safeStorage keeps the
 * bearer token out of the YAML settings file and out of Renderer JavaScript.
 * Refuse to create a durable token where the OS encryption service is absent.
 */
export function createElectronMcpCredentialStore(): McpCredentialStore {
  const filePath = join(app.getPath("userData"), CREDENTIAL_FILE_NAME);
  const persistence: McpCredentialPersistence = {
    async load() {
      assertEncryptionAvailable();
      try {
        const encrypted = await readFile(filePath);
        return safeStorage.decryptString(encrypted);
      } catch (error) {
        if (isMissingFileError(error)) return null;
        throw new Error("Unable to read the protected MCP credential.", { cause: error });
      }
    },
    async save(token) {
      assertEncryptionAvailable();
      await mkdir(dirname(filePath), { recursive: true });
      const encrypted = safeStorage.encryptString(token);
      const temporaryPath = `${filePath}.tmp`;
      await writeFile(temporaryPath, encrypted, { mode: 0o600 });
      await rename(temporaryPath, filePath);
    },
  };

  return createMcpCredentialStore({ persistence });
}

function assertEncryptionAvailable() {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("MCP credentials require an available operating-system encryption service.");
  }
}

function isMissingFileError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "ENOENT"
  );
}
