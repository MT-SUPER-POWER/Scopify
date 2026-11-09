import type { MusicCapability } from "@scopify/music-domain/capability";

import { SEARCH_CATEGORY_CAPABILITIES } from "@/constants/search";
import { CATEGORIES, type Category } from "@/types/search/model";

const SEARCH_CATEGORY_PARAM = "tab";

export function getSearchCategory(value: null | string): Category {
  return CATEGORIES.find((category) => category === value) ?? "All";
}

/** Whether the platform with these capabilities can search a tab's content. */
export function isSearchCategoryAvailable(
  capabilities: ReadonlySet<MusicCapability>,
  category: Category,
): boolean {
  const required = SEARCH_CATEGORY_CAPABILITIES[category];
  return required === undefined || capabilities.has(required);
}

export function getAvailableSearchCategories(
  capabilities: ReadonlySet<MusicCapability>,
): Category[] {
  return CATEGORIES.filter((category) => isSearchCategoryAvailable(capabilities, category));
}

/** The tab in a URL, or All when the platform cannot search it (a link from another platform). */
export function resolveSearchCategory(
  value: null | string,
  capabilities: ReadonlySet<MusicCapability>,
): Category {
  const category = getSearchCategory(value);
  return isSearchCategoryAvailable(capabilities, category) ? category : "All";
}

export function buildSearchUrl(keywords: string, category: Category = "All") {
  return buildSearchCategoryUrl(new URLSearchParams({ keywords }).toString(), category);
}

export function buildSearchCategoryUrl(query: string, category: Category) {
  const params = new URLSearchParams(query);

  if (category === "All") params.delete(SEARCH_CATEGORY_PARAM);
  else params.set(SEARCH_CATEGORY_PARAM, category);

  const search = params.toString();
  return search ? `/search?${search}` : "/search";
}
