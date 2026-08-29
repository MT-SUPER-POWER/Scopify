import type { FoliaStageTheme } from "@/types/foliaStage";

export const areFoliaThemesEqual = (left: FoliaStageTheme, right: FoliaStageTheme) =>
  left.id === right.id &&
  left.name === right.name &&
  areThemeColorsEqual(left.light, right.light) &&
  areThemeColorsEqual(left.dark, right.dark);

const areThemeColorsEqual = (left: FoliaStageTheme["light"], right: FoliaStageTheme["light"]) =>
  left.accentColor === right.accentColor &&
  left.backgroundColor === right.backgroundColor &&
  left.primaryColor === right.primaryColor &&
  left.secondaryColor === right.secondaryColor;
