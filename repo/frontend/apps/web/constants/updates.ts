import type { UpdatesManifest } from "@/types/updates";

export const UPDATES_SEEN_KEY = "scopify:updates:last-seen";
export const UPDATE_COMMIT_URL = "https://github.com/MT-SUPER-POWER/Scopify/commit/";
export const UPDATES_CHANGELOG_URL =
  "https://github.com/MT-SUPER-POWER/Scopify/blob/master/docs/CHANGELOG.md";
/** Select value for the dev-only preview of commits after the latest tag. */
export const UPDATES_UNRELEASED_KEY = "unreleased";
// Embedded by next.config.ts: works offline in the exported desktop renderer too.
export const UPDATES: UpdatesManifest = JSON.parse(
  process.env.NEXT_PUBLIC_UPDATES || '{"currentVersion":"","releases":[]}',
);
