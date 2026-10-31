import { createInstance, type TOptions } from "i18next";
import { resources } from "@/locales/resources";
import type { AppLocale } from "@/types/settings/config";

type SourceResources = (typeof resources)["zh-CN"];
export type TranslationParams = Record<string, string | number>;
export type TranslationKey = {
  [
    Namespace in keyof SourceResources
  ]: `${Namespace & string}.${keyof SourceResources[Namespace] & string}`;
}[keyof SourceResources];

export const languageLabelKeys: Record<AppLocale, TranslationKey> = {
  "zh-CN": "common.language.simplifiedChinese",
  "zh-TW": "common.language.traditionalChinese",
  "en-US": "common.language.english",
};

const i18n = createInstance();
void i18n.init({
  resources,
  lng: "zh-CN",
  fallbackLng: "zh-CN",
  defaultNS: "common",
  load: "currentOnly",
  keySeparator: false,
  nsSeparator: false,
  initAsync: false,
  interpolation: { escapeValue: false },
  missingInterpolationHandler: () => "",
});

// Existing application keys include the namespace before the first dot.
const translateResource = i18n.t.bind(i18n) as unknown as (
  key: string,
  options: TOptions,
) => string;

export function translate(locale: AppLocale, key: TranslationKey, params?: TranslationParams) {
  const separator = key.indexOf(".");
  const namespace = key.slice(0, separator) as keyof SourceResources;
  const resourceKey = key.slice(separator + 1);
  return translateResource(resourceKey, {
    ns: namespace,
    lng: locale,
    replace: params,
    skipInterpolation: !params,
    defaultValue: key,
  });
}
