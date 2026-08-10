"use client";

import { useEffect } from "react";

import {
  normalizeFoliaStageSettings,
  selectFoliaStageSettings,
} from "@/lib/lyrics/foliaStageSettings";
import { setupStoreSync } from "@/lib/storeSync";
import { useLyricStageStore } from "@/store/module/lyrics";

const FOLIA_STAGE_SYNC_CHANNEL = "scopify-folia-stage-settings";

export function FoliaStageStoreSync() {
  useEffect(
    () =>
      setupStoreSync(useLyricStageStore, {
        applySnapshot: (snapshot) => useLyricStageStore.getState().replaceSettings(snapshot),
        channelName: FOLIA_STAGE_SYNC_CHANNEL,
        parseSnapshot: (candidate) =>
          normalizeFoliaStageSettings(
            candidate,
            selectFoliaStageSettings(useLyricStageStore.getState()),
          ),
        selectSnapshot: selectFoliaStageSettings,
      }),
    [],
  );

  return null;
}
