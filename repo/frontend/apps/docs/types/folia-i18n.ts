export type TranslationKey = string;

export type TranslateFn = (key: string, values?: Record<string, unknown>) => string;
