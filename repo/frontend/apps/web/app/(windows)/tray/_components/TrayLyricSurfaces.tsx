"use client";

import { Captions, Lock, PanelTop, PanelBottom } from "lucide-react";
import { useCompanionPreferences } from "@/hooks/desktopCompanion/useCompanionPreferences";
import { runtime } from "@/lib/runtime";
import { useTranslation } from "react-i18next";

import { TraySwitchRow } from "./TraySwitchRow";

/**
 * 托盘里的歌词外显开关：桌面歌词、灵动岛、任务栏歌词。
 * 桌面歌词锁定后若找不到解锁按钮，可以在这里直接解锁。
 */
export function TrayLyricSurfaces() {
  const { t } = useTranslation();
  const [lyric, setLyric] = useCompanionPreferences(
    runtime.desktopLyrics.getPreferences,
    runtime.desktopLyrics.onPreferencesChanged,
  );
  const [island] = useCompanionPreferences(
    runtime.dynamicIsland.getPreferences,
    runtime.dynamicIsland.onPreferencesChanged,
  );
  const [taskbar] = useCompanionPreferences(
    runtime.taskbarLyric.getPreferences,
    runtime.taskbarLyric.onPreferencesChanged,
  );

  return (
    <>
      <TraySwitchRow
        icon={Captions}
        label={t("subtitleControl.enabled")}
        checked={Boolean(lyric?.enabled)}
        onToggle={() => void runtime.desktopLyrics.toggle()}
      />
      {lyric?.enabled && (
        <TraySwitchRow
          icon={Lock}
          label={t("desktopLyrics.lock")}
          checked={lyric.locked}
          onToggle={() =>
            void runtime.desktopLyrics.updatePreferences({ locked: !lyric.locked }).then((next) => {
              if (next) setLyric(next);
            })
          }
        />
      )}
      <TraySwitchRow
        icon={PanelTop}
        label={t("dynamicIsland.title")}
        checked={Boolean(island?.enabled)}
        onToggle={() => void runtime.dynamicIsland.toggle()}
      />
      {taskbar?.supported && (
        <TraySwitchRow
          icon={PanelBottom}
          label={t("taskbarLyric.title")}
          checked={Boolean(taskbar.enabled)}
          onToggle={() => void runtime.taskbarLyric.toggle()}
        />
      )}
    </>
  );
}
