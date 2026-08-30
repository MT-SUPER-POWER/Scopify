import { CATEGORIES, type Category, type SearchRecentEntry } from "@/types/search";

const MAX_SEARCH_RECENT_ENTRIES = 20;

function isSearchCategory(value: unknown): value is Category {
  return typeof value === "string" && CATEGORIES.includes(value as Category);
}

function toSearchRecentEntry(value: unknown): SearchRecentEntry | null {
  if (typeof value === "string") {
    const keyword = value.trim();
    return keyword ? { category: "All", keyword } : null;
  }

  if (!value || typeof value !== "object") return null;

  const entry = value as Partial<SearchRecentEntry>;
  const keyword = typeof entry.keyword === "string" ? entry.keyword.trim() : "";
  if (!keyword) return null;

  return {
    category: isSearchCategory(entry.category) ? entry.category : "All",
    keyword,
  };
}

function getSearchRecentEntryKey(entry: SearchRecentEntry) {
  return entry.keyword;
}

export function normalizeSearchRecentEntries(value: unknown): SearchRecentEntry[] {
  if (!Array.isArray(value)) return [];

  const recent: SearchRecentEntry[] = [];
  const seen = new Set<string>();

  for (const item of value) {
    const entry = toSearchRecentEntry(item);
    if (!entry) continue;

    const key = getSearchRecentEntryKey(entry);
    if (seen.has(key)) continue;

    seen.add(key);
    recent.push(entry);
    if (recent.length === MAX_SEARCH_RECENT_ENTRIES) break;
  }

  return recent;
}

export function upsertSearchRecentEntry(
  recent: SearchRecentEntry[],
  value: SearchRecentEntry,
): SearchRecentEntry[] {
  const entry = toSearchRecentEntry(value);
  if (!entry) return recent;

  const key = getSearchRecentEntryKey(entry);
  return [entry, ...recent.filter((item) => getSearchRecentEntryKey(item) !== key)].slice(
    0,
    MAX_SEARCH_RECENT_ENTRIES,
  );
}
