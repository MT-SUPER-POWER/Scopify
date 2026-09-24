"use client";

import dynamic from "next/dynamic";
import { useFoliaSettingsStore } from "@/store/module/foliaSettings";
import { useLyricStageStore } from "@/store/module/lyrics";

const FoliaSettingsHost = dynamic(
  () => import("./FoliaSettingsHost").then((module) => module.FoliaSettingsHost),
  { ssr: false },
);

export function FoliaSettingsMount() {
  const isOpen = useFoliaSettingsStore(
    (state) => state.visualSection !== null || state.themeLibraryOpen,
  );
  const warningOpen = useLyricStageStore((state) => state.sonnetPerformanceWarningOpen);
  return isOpen || warningOpen ? <FoliaSettingsHost /> : null;
}
