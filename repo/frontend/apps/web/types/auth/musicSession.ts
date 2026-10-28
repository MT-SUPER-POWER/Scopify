export interface MusicSessionMigrationResponse {
  json(): Promise<unknown>;
  ok: boolean;
}

export interface MusicSessionMigrationEnvironment {
  fetch(input: URL, init: RequestInit): Promise<MusicSessionMigrationResponse>;
  storage: Pick<Storage, "getItem" | "removeItem">;
}
