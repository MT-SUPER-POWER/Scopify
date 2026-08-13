import { messages } from "@/constants/i18n";
import type { AppLocale } from "@/types/config";

export { messages };

export type TranslationParams = Record<string, string | number>;
export type TranslationKey = keyof (typeof messages)["zh-CN"];

export const languageLabelKeys: Record<AppLocale, TranslationKey> = {
  "zh-CN": "common.language.simplifiedChinese",
  "zh-TW": "common.language.traditionalChinese",
  "en-US": "common.language.english",
};

function interpolate(template: string, params?: TranslationParams) {
  if (!params) return template;

  return template.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => {
    const value = params[name];
    return value === undefined ? "" : String(value);
  });
}

export function translate(locale: AppLocale, key: TranslationKey, params?: TranslationParams) {
  const template = messages[locale][key] ?? messages["zh-CN"][key] ?? key;
  return interpolate(template, params);
}
