import type {
  McpCredentialStore,
  CreateMcpCredentialStoreOptions,
} from "@/types/service/mcp/credentialStore";
export type {
  McpCredentialStore,
  McpCredentialPersistence,
  CreateMcpCredentialStoreOptions,
} from "@/types/service/mcp/credentialStore";
import { randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Creates an at-rest-agnostic credential store. Production composition passes
 * an Electron safeStorage persistence adapter; tests use the in-memory form.
 */
export function createMcpCredentialStore(
  options: CreateMcpCredentialStoreOptions = {},
): McpCredentialStore {
  const createToken = options.createToken ?? (() => randomBytes(32).toString("base64url"));
  let token: string | null = null;
  let loading: Promise<string> | null = null;

  async function getOrCreate() {
    if (token) return token;
    if (!loading) {
      loading = (async () => {
        const persisted = await options.persistence?.load();
        const next = persisted && persisted.length > 0 ? persisted : createToken();
        if (!persisted) await options.persistence?.save(next);
        token = next;
        return next;
      })().finally(() => {
        loading = null;
      });
    }
    return loading;
  }

  return {
    getOrCreate,
    async rotate() {
      // A request may be reading the persisted token while the user rotates
      // it. Wait for that read to settle so it cannot overwrite the new
      // in-memory token after rotation has already been reported successful.
      if (loading) await loading;
      const next = createToken();
      await options.persistence?.save(next);
      token = next;
      return next;
    },
    async verify(candidate) {
      if (!candidate) return false;
      const expected = Buffer.from(await getOrCreate());
      const received = Buffer.from(candidate);
      return expected.length === received.length && timingSafeEqual(expected, received);
    },
  };
}
