import type { UpdatesManifest } from "@/types/updates";

export const UPDATES_PAGE_SIZE = 8;
export const UPDATES_SEEN_KEY = "scopify:updates:last-seen";
export const UPDATE_COMMIT_URL = "https://github.com/MT-SUPER-POWER/Scopify/commit/";
// Embedded by next.config.ts: works offline in the exported desktop renderer too.
export const UPDATES: UpdatesManifest = JSON.parse(
  process.env.NEXT_PUBLIC_UPDATES || '{"currentVersion":"","releases":[]}',
);
