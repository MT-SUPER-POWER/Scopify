import { afterEach, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { useCommandWorkspaceQuickSettings } from "@/hooks/commandWorkspace/useCommandWorkspaceQuickSettings";
import { i18n } from "@/lib/i18n";
import { useI18nStore } from "@/store/module/i18n";
import { usePerformanceStore } from "@/store/module/performance";
import type { CommandWorkspaceSettingsItem } from "@/types/commandWorkspace/model";

function readCommands() {
  let commands: CommandWorkspaceSettingsItem[] = [];
  function Probe() {
    commands = useCommandWorkspaceQuickSettings();
    return null;
  }
  renderToStaticMarkup(<Probe />);
  return commands;
}

afterEach(() => {
  useI18nStore.getState().setLocale("zh-CN");
  usePerformanceStore.getState().setProgressRefreshRate("display");
});

test("language commands update the settings store and active translation together", () => {
  const commands = readCommands();
  const english = commands.find((item) => item.id === "setting:language:en-US");
  expect(english).toBeDefined();
  english?.action();
  expect(useI18nStore.getState().locale).toBe("en-US");
  expect(i18n.language).toBe("en-US");

  commands.find((item) => item.id === "setting:language:zh-TW")?.action();
  expect(useI18nStore.getState().locale).toBe("zh-TW");
  expect(i18n.language).toBe("zh-TW");
});

test("progress commands change the shared playback preference and can restore display sync", () => {
  const commands = readCommands();
  commands.find((item) => item.id === "setting:progress:30")?.action();
  expect(usePerformanceStore.getState().progressRefreshRate).toBe("30");
  commands.find((item) => item.id === "setting:progress:60")?.action();
  expect(usePerformanceStore.getState().progressRefreshRate).toBe("60");
  commands.find((item) => item.id === "setting:progress:display")?.action();
  expect(usePerformanceStore.getState().progressRefreshRate).toBe("display");
});
