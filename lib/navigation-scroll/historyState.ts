import type {
  NavigationScrollEntryId,
  NavigationScrollHistoryState,
} from "@/types/navigation-scroll";

export const NAVIGATION_SCROLL_HISTORY_NAMESPACE = "__scopify";

const NAVIGATION_SCROLL_ENTRY_FIELD = "navigationScrollEntryId";

function isHistoryStateRecord(value: unknown): value is NavigationScrollHistoryState {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readNamespace(state: NavigationScrollHistoryState): NavigationScrollHistoryState {
  const namespace = state[NAVIGATION_SCROLL_HISTORY_NAMESPACE];
  return isHistoryStateRecord(namespace) ? namespace : {};
}

/** Read only Scopify's namespaced value and leave all foreign state untouched. */
export function getNavigationScrollEntryId(state: unknown): NavigationScrollEntryId | null {
  if (!isHistoryStateRecord(state)) return null;

  const entryId = readNamespace(state)[NAVIGATION_SCROLL_ENTRY_FIELD];
  return typeof entryId === "string" && entryId.length > 0 ? entryId : null;
}

/**
 * Creates a new history-state object without replacing Next.js private state.
 * History state is normally an object; null is supported for defensive use in
 * browser environments outside the App Router.
 */
export function withNavigationScrollEntryId(
  state: unknown,
  entryId: NavigationScrollEntryId,
): NavigationScrollHistoryState {
  const stateRecord = isHistoryStateRecord(state) ? state : {};

  return {
    ...stateRecord,
    [NAVIGATION_SCROLL_HISTORY_NAMESPACE]: {
      ...readNamespace(stateRecord),
      [NAVIGATION_SCROLL_ENTRY_FIELD]: entryId,
    },
  };
}

export function createNavigationScrollEntryId(): NavigationScrollEntryId {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `scroll-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
