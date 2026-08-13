import type { SongStats } from "@/types/api/music";

export type SongStatsEnrichmentStatus = "complete" | "failed" | "idle" | "loading" | "partial";

export interface SongStatsEnrichmentState {
  stats: SongStats;
  status: SongStatsEnrichmentStatus;
}

export interface SongStatsLoadResult {
  error?: unknown;
  value?: number;
}
