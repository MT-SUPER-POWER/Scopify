import { describe, expect, test } from "bun:test";
import { translate } from "../../lib/i18n";
import { resources } from "../../locales/resources";

describe("i18n runtime", () => {
  test("uses the requested locale and keeps empty translations", () => {
    expect(translate("zh-CN", "common.action.confirm")).toBe("确认");
    expect(translate("zh-TW", "common.action.confirm")).toBe("確認");
    expect(translate("en-US", "common.action.confirm")).toBe("Confirm");
    expect(translate("en-US", "folia.ui.waitingForMusic")).toBe("");
  });

  test("interpolates without escaping and preserves the no-params behavior", () => {
    expect(translate("zh-CN", "common.message.requestFailed", { message: "<a&b>" })).toBe(
      "请求失败: <a&b>",
    );
    expect(translate("zh-CN", "common.message.requestFailed")).toBe("请求失败: {{message}}");
    expect(translate("zh-CN", "common.message.requestFailed", {})).toBe("请求失败: ");
  });

  test("falls back to simplified Chinese for missing translations", () => {
    const translations: Record<string, string> = resources["en-US"].common;
    const key = "action.confirm";
    const previous = translations[key];
    delete translations[key];
    try {
      expect(translate("en-US", "common.action.confirm")).toBe("确认");
    } finally {
      translations[key] = previous;
    }
  });
});
