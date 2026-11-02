import { afterEach, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { useTranslation } from "react-i18next";
import type { TOptions } from "i18next";
import { i18n, translate } from "@/lib/i18n";
import { resources } from "@/locales/resources";
import { useI18nStore } from "@/store/module/i18n";

function Labels() {
  const { t } = useTranslation();
  return (
    <>
      {t("ui.next")} / {t("folia.ui.nextMode")}
    </>
  );
}

afterEach(() => useI18nStore.getState().setLocale("zh-CN"));

test("React translation resolves namespaces and flat keys when the language changes", () => {
  useI18nStore.getState().setLocale("en-US");
  expect(renderToStaticMarkup(<Labels />)).toBe("Next / Next");
  useI18nStore.getState().setLocale("zh-CN");
  expect(renderToStaticMarkup(<Labels />)).toBe("下一首 / 下一个");
});

test("non-React translations preserve flat keys and explicit locale", () => {
  useI18nStore.getState().setLocale("zh-CN");
  expect(translate("en-US", "ui.next")).toBe("Next");
  expect(translate("zh-CN", "folia.ui.nextMode")).toBe("下一个");
  expect(i18n.language).toBe("zh-CN");
  expect<string>(
    i18n.t("nowPlaying.fans", {
      lng: "en-US",
      count: 12345,
      replace: { count: "12,345" },
    }),
  ).toBe("12,345 followers");
});

test("every literal resource key resolves through the official namespace syntax", () => {
  const t = i18n.t as unknown as (key: string, options?: TOptions) => string;
  for (const [locale, namespaces] of Object.entries(resources)) {
    for (const [namespace, messages] of Object.entries(namespaces)) {
      for (const [key, value] of Object.entries(messages)) {
        expect(
          t(`${namespace}.${key}`, {
            lng: locale,
            skipInterpolation: true,
          }),
        ).toBe(value);
      }
    }
  }
});
