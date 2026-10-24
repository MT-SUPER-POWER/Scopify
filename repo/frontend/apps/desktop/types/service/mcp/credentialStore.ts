export interface McpCredentialStore {
  /** Returns the current raw token only inside Electron Main. */
  getOrCreate(): Promise<string>;
  /** Creates and persists a new token, immediately invalidating the old one. */
  rotate(): Promise<string>;
  verify(candidate: string | null): Promise<boolean>;
}

export interface McpCredentialPersistence {
  load(): Promise<string | null>;
  save(token: string): Promise<void>;
}

export interface CreateMcpCredentialStoreOptions {
  createToken?(): string;
  persistence?: McpCredentialPersistence;
}
