import type { TranslationKey } from "@/lib/i18n";
import type { AppUpdateStatus } from "@/types/updater";

// Shared renderer metadata for update status labels and unread-version persistence.
export const UPDATE_SEEN_VERSION_KEY = "scopify-update-seen-version";

export const UPDATE_STATUS_LABEL_KEYS: Record<AppUpdateStatus, TranslationKey> = {
  idle: "settings.updater.state.idle",
  checking: "settings.updater.state.checking",
  available: "settings.updater.state.available",
  "not-available": "settings.updater.state.notAvailable",
  downloading: "settings.updater.state.downloading",
  downloaded: "settings.updater.state.downloaded",
  unsupported: "settings.updater.state.unsupported",
  error: "settings.updater.state.error",
};
