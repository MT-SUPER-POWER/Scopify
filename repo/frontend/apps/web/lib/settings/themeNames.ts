import type { NamedTheme } from "@/types/appearance-theme-editor";

export function isThemeNameValid(theme: NamedTheme, themes: readonly NamedTheme[]) {
  const name = theme.name.trim();
  return (
    name.length > 0 &&
    name.length <= 40 &&
    !themes.some(
      (item) => item.id !== theme.id && item.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
    )
  );
}

export function uniqueThemeName(name: string, themes: readonly NamedTheme[]) {
  const base = name.trim().slice(0, 40);
  let candidate = base;
  let suffix = 1;
  while (themes.some((item) => item.name.toLocaleLowerCase() === candidate.toLocaleLowerCase())) {
    const ending = ` (${++suffix})`;
    candidate = `${base.slice(0, 40 - ending.length)}${ending}`;
  }
  return candidate;
}
