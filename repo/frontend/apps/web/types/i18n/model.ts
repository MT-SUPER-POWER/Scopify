import type { TranslationKey, TranslationParams } from "@/lib/i18n";

export type TranslateFn = (key: TranslationKey, params?: TranslationParams) => string;
