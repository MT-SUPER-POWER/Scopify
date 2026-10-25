"use client";

import { useState } from "react";
import { useCompanionPreferences } from "@/hooks/desktopCompanion/useCompanionPreferences";
import { runtime } from "@/lib/runtime";
import type { DynamicIslandPreferencesUpdate } from "@/types/dynamicIsland";

export function useCommandWorkspaceDynamicIsland() {
  const [preferences, setPreferences] = useCompanionPreferences(
    runtime.dynamicIsland.getPreferences,
    runtime.dynamicIsland.onPreferencesChanged,
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = async (patch: DynamicIslandPreferencesUpdate) => {
    if (!preferences || isUpdating) return;
    setIsUpdating(true);
    setError(null);
    try {
      const next = await runtime.dynamicIsland.updatePreferences(patch);
      if (!next) throw new Error("Preferences unavailable");
      setPreferences(next);
    } catch {
      setError("保存失败，请重试。");
    } finally {
      setIsUpdating(false);
    }
  };

  return { preferences, update, isUpdating, error };
}
