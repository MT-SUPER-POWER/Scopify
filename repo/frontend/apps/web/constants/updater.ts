import type { TranslationKey } from "@/lib/i18n";
import type { AppUpdateState, AppUpdateStatus } from "@/types/desktop/updater";

// Shared renderer metadata for update status labels and unread-version persistence.
export const UPDATE_SEEN_VERSION_KEY = "scopify-update-seen-version";

const UPDATE_STATUS_LABEL_KEYS: Record<AppUpdateStatus, TranslationKey> = {
  idle: "settings.updater.state.idle",
  checking: "settings.updater.state.checking",
  available: "settings.updater.state.available",
  "not-available": "settings.updater.state.notAvailable",
  downloading: "settings.updater.state.downloading",
  downloaded: "settings.updater.state.downloaded",
  unsupported: "settings.updater.state.unsupported",
  error: "settings.updater.state.error",
};

const UPDATE_DOWNLOAD_PHASE_LABEL_KEYS: Record<
  NonNullable<AppUpdateState["downloadPhase"]>,
  TranslationKey
> = {
  differential: "settings.updater.state.downloadingDifferential",
  full: "settings.updater.state.downloadingFull",
  "full-fallback": "settings.updater.state.downloadingFullFallback",
};

export function getUpdateStatusLabelKey({ status, downloadPhase }: AppUpdateState): TranslationKey {
  if (status === "downloading" && downloadPhase) {
    return UPDATE_DOWNLOAD_PHASE_LABEL_KEYS[downloadPhase];
  }
  return UPDATE_STATUS_LABEL_KEYS[status];
}
