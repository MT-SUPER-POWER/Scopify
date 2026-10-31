import { createInstance, type TOptions } from "i18next";
import { initReactI18next } from "react-i18next";
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

export const i18n = createInstance();
const namespaces = Object.keys(resources["zh-CN"]) as (keyof SourceResources)[];
void i18n.use(initReactI18next).init({
  resources,
  lng: "zh-CN",
  fallbackLng: "zh-CN",
  ns: namespaces,
  defaultNS: ["common", ...namespaces.filter((namespace) => namespace !== "common")],
  load: "currentOnly",
  keySeparator: ".",
  nsSeparator: ".",
  initAsync: false,
  interpolation: { escapeValue: false },
  missingInterpolationHandler: () => "",
});

const translateResource = i18n.t.bind(i18n) as unknown as (
  key: string,
  options: TOptions,
) => string;

export function translate(locale: AppLocale, key: TranslationKey, params?: TranslationParams) {
  return translateResource(key, {
    lng: locale,
    replace: params,
    skipInterpolation: !params,
    defaultValue: key,
  });
}
