import { CATEGORIES, type Category } from "@/types/search";

const SEARCH_CATEGORY_PARAM = "tab";

export function getSearchCategory(value: null | string): Category {
  return CATEGORIES.find((category) => category === value) ?? "All";
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
