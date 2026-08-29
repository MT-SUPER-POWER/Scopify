import type { TranslationKey } from "@/lib/i18n";
import type {
  PersonalFmModeId,
  PersonalFmSceneCategory,
  PersonalFmSelection,
} from "@/types/personalFm";

export const PERSONAL_FM_PLAYBACK_SOURCE_ID = "personal-fm";
export const PERSONAL_FM_REFILL_THRESHOLD = 2;

export const DEFAULT_PERSONAL_FM_SELECTION: PersonalFmSelection = {
  mode: "DEFAULT",
  scene: null,
};

export interface PersonalFmModeOption {
  id: PersonalFmModeId;
  labelKey: TranslationKey;
}

export interface PersonalFmSceneOption {
  category: PersonalFmSceneCategory;
  id: string;
  labelKey: TranslationKey;
}

export const PERSONAL_FM_MODES: readonly PersonalFmModeOption[] = [
  { id: "DEFAULT", labelKey: "personalFm.mode.default" },
  { id: "FAMILIAR", labelKey: "personalFm.mode.familiar" },
  { id: "EXPLORE", labelKey: "personalFm.mode.explore" },
  { id: "PUZZLE_MODE_RCMD", labelKey: "personalFm.mode.puzzle" },
  { id: "SCENE_RCMD", labelKey: "personalFm.mode.scene" },
];

export const PERSONAL_FM_SCENE_CATEGORY_LABELS: Record<PersonalFmSceneCategory, TranslationKey> = {
  mood: "personalFm.category.mood",
  activity: "personalFm.category.activity",
  genre: "personalFm.category.genre",
  language: "personalFm.category.language",
};

export const PERSONAL_FM_SCENES: readonly PersonalFmSceneOption[] = [
  { id: "NIGHT_EMO", category: "mood", labelKey: "personalFm.scene.nightEmo" },
  { id: "CURE", category: "mood", labelKey: "personalFm.scene.cure" },
  { id: "CHEERFUL", category: "mood", labelKey: "personalFm.scene.cheerful" },
  { id: "LYRICAL", category: "mood", labelKey: "personalFm.scene.lyrical" },
  { id: "INSPIRATIONAL", category: "mood", labelKey: "personalFm.scene.inspirational" },
  { id: "RELAX", category: "mood", labelKey: "personalFm.scene.relax" },
  { id: "SWEET", category: "mood", labelKey: "personalFm.scene.sweet" },
  { id: "EXERCISE", category: "activity", labelKey: "personalFm.scene.exercise" },
  { id: "FOCUS", category: "activity", labelKey: "personalFm.scene.focus" },
  { id: "SLEEP_HELP", category: "activity", labelKey: "personalFm.scene.sleep" },
  { id: "TAKE_SHOWER", category: "activity", labelKey: "personalFm.scene.shower" },
  { id: "COMMUTE", category: "activity", labelKey: "personalFm.scene.commute" },
  { id: "COFFEE_SHOP", category: "activity", labelKey: "personalFm.scene.coffeeShop" },
  { id: "GAMES", category: "activity", labelKey: "personalFm.scene.gaming" },
  { id: "DANCE", category: "activity", labelKey: "personalFm.scene.dance" },
  { id: "RAINY", category: "activity", labelKey: "personalFm.scene.rainy" },
  { id: "RHYTHM_BLUES", category: "genre", labelKey: "personalFm.scene.rhythmBlues" },
  { id: "RAP", category: "genre", labelKey: "personalFm.scene.rap" },
  { id: "K_POP", category: "genre", labelKey: "personalFm.scene.kPop" },
  { id: "ELECTRONIC", category: "genre", labelKey: "personalFm.scene.electronic" },
  { id: "ROCK", category: "genre", labelKey: "personalFm.scene.rock" },
  { id: "FOLK", category: "genre", labelKey: "personalFm.scene.folk" },
  { id: "GUDIAN", category: "genre", labelKey: "personalFm.scene.classical" },
  { id: "JAZZ", category: "genre", labelKey: "personalFm.scene.jazz" },
  { id: "BLUE", category: "genre", labelKey: "personalFm.scene.blues" },
  { id: "PUNK", category: "genre", labelKey: "personalFm.scene.funk" },
  { id: "COUNTRY", category: "genre", labelKey: "personalFm.scene.country" },
  { id: "LIGHT", category: "genre", labelKey: "personalFm.scene.lightMusic" },
  { id: "GUOFENG", category: "genre", labelKey: "personalFm.scene.guofeng" },
  { id: "MANYAO", category: "genre", labelKey: "personalFm.scene.slowDj" },
  { id: "MUSICAL", category: "genre", labelKey: "personalFm.scene.musical" },
  { id: "ACG", category: "genre", labelKey: "personalFm.scene.acg" },
  { id: "JINGDIAN", category: "genre", labelKey: "personalFm.scene.classics" },
  {
    id: "ORIGINAL_MUSICIAL",
    category: "genre",
    labelKey: "personalFm.scene.indieOriginal",
  },
  { id: "YINGSHI", category: "genre", labelKey: "personalFm.scene.soundtrack" },
  { id: "CHINESE", category: "language", labelKey: "personalFm.scene.mandarin" },
  { id: "ENGLISH", category: "language", labelKey: "personalFm.scene.western" },
  { id: "YUEYU", category: "language", labelKey: "personalFm.scene.cantonese" },
  { id: "JAPANESE", category: "language", labelKey: "personalFm.scene.japanese" },
  { id: "FRANCH", category: "language", labelKey: "personalFm.scene.french" },
  { id: "LATIN", category: "language", labelKey: "personalFm.scene.latin" },
  { id: "GLOBAL", category: "language", labelKey: "personalFm.scene.global" },
];

const PERSONAL_FM_MODE_IDS = new Set<string>(PERSONAL_FM_MODES.map((mode) => mode.id));
const PERSONAL_FM_SCENE_IDS = new Set(PERSONAL_FM_SCENES.map((scene) => scene.id));

export function normalizePersonalFmSelection(value: unknown): PersonalFmSelection {
  const candidate = value as Partial<PersonalFmSelection> | null | undefined;
  const mode =
    typeof candidate?.mode === "string" && PERSONAL_FM_MODE_IDS.has(candidate.mode)
      ? (candidate.mode as PersonalFmModeId)
      : DEFAULT_PERSONAL_FM_SELECTION.mode;

  if (mode !== "SCENE_RCMD") return { mode, scene: null };
  const scene =
    typeof candidate?.scene === "string" && PERSONAL_FM_SCENE_IDS.has(candidate.scene)
      ? candidate.scene
      : null;
  return scene ? { mode, scene } : DEFAULT_PERSONAL_FM_SELECTION;
}

export function isPersonalFmPlaybackSource(sourceId: number | string | null | undefined) {
  return sourceId === PERSONAL_FM_PLAYBACK_SOURCE_ID;
}

export function getPersonalFmSelectionLabel(
  selection: PersonalFmSelection,
  t: (key: TranslationKey) => string,
) {
  const mode = PERSONAL_FM_MODES.find((option) => option.id === selection.mode);
  const modeLabel = mode ? t(mode.labelKey) : t("personalFm.mode.default");
  if (selection.mode !== "SCENE_RCMD" || !selection.scene) return modeLabel;
  const scene = PERSONAL_FM_SCENES.find((option) => option.id === selection.scene);
  return scene ? `${modeLabel} · ${t(scene.labelKey)}` : modeLabel;
}
