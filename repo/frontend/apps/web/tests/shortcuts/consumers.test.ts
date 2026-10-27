import { expect, mock, test } from "bun:test";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

mock.module("@/store/module/i18n", () => ({ useI18n: () => ({ t: (key: string) => key }) }));
mock.module("@/store/module/shortcuts", () => ({
  useShortcutStore: (
    select: (state: { overrides: { "toggle-playback": { key: string } } }) => unknown,
  ) => select({ overrides: { "toggle-playback": { key: "Home" } } }),
}));
const { ShortcutHint } = await import("@/components/shortcuts/ShortcutHint");
const { ShortcutCommandIcon } = await import("@/components/shortcuts/ShortcutCommandIcon");

test("hint derives translated text and customized binding from the command ID", () => {
  const html = renderToString(createElement(ShortcutHint, { commandId: "toggle-playback" }));
  expect(html).toContain("shortcuts.command.togglePlayback");
  expect(html).toContain("Home");
  const custom = renderToString(
    createElement(ShortcutHint, { commandId: "toggle-playback", label: "暂停" }),
  );
  expect(custom).toContain("暂停");
  expect(custom).not.toContain("shortcuts.command.togglePlayback");
});

test("icon resolves declarations while preserving an unknown-ID fallback", () => {
  const html = renderToString(createElement(ShortcutCommandIcon, { commandId: "toggle-playback" }));
  expect(html).toContain("<svg");
  expect(renderToString(createElement(ShortcutCommandIcon, { commandId: "unknown" }))).toContain(
    "<svg",
  );
});
