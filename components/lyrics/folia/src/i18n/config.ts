import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import zhCN from './locales/zh-CN';
import ind from './locales/in';
import { resolveMissingTranslation } from './missingTranslation';

/*
 * Hardcoded Chinese fallback dictionary.
 * Flattened at build-time from zh-CN.ts so every key has a Chinese fallback
 * baked directly into the JS bundle — no dependency on i18next resource loading.
 */
function flattenLocale(obj: Record<string, any>, prefix = ''): Record<string, string> {
  let result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      result = { ...result, ...flattenLocale(value, path) };
    } else {
      result[path] = String(value);
    }
  }
  return result;
}

const ZH_FALLBACKS: Record<string, string> = flattenLocale(zhCN);

const i18n = createInstance();

i18n
  .use(initReactI18next)
  .init({
    initAsync: false,
    lng: 'en',
    resources: {
      en: {
        translation: en
      },
      'zh-CN': {
        translation: zhCN
      },
      in: {
        translation: ind
      }
    },
    fallbackLng: 'en',
    parseMissingKeyHandler: (key: string, defaultValue?: string): string => (
      resolveMissingTranslation(ZH_FALLBACKS, key, defaultValue)
    ),
    supportedLngs: ['en', 'zh-CN', 'in'],
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
