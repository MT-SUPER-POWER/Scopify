import type { DesktopPlaybackWallpaperPreferences } from "@scopifymusicplayer/desktop-contract";
import { z } from "zod";

import type { SystemWallpaperFallbackOperationResult } from "../../../types/systemWallpaperFallback.js";

const SYSTEM_WALLPAPER_RESULT_SCHEMA = z
  .object({
    Applied: z.boolean().optional(),
    Error: z.string().optional(),
    Ok: z.boolean(),
    Restored: z.boolean().optional(),
    SkippedUserChange: z.boolean().optional(),
  })
  .passthrough();

export function shouldUseDesktopPlaybackWallpaperSystemFallback(
  preferences: DesktopPlaybackWallpaperPreferences,
) {
  return (
    preferences.enabled && preferences.layers.background && preferences.systemWallpaperFallback
  );
}

export function parseSystemWallpaperResult(
  stdout: string,
  stderr: string,
  exitCode: number | null,
): SystemWallpaperFallbackOperationResult {
  const lastOutputLine = stdout.trim().split(/\r?\n/).at(-1);
  if (!lastOutputLine) {
    return {
      error: stderr.trim() || "Windows system-wallpaper host returned no result.",
      success: false,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(lastOutputLine);
  } catch (error) {
    return {
      error: `Windows system-wallpaper host returned invalid JSON: ${String(error)}`,
      success: false,
    };
  }

  const result = SYSTEM_WALLPAPER_RESULT_SCHEMA.safeParse(parsed);
  if (!result.success || exitCode !== 0 || !result.data.Ok) {
    return {
      detail: result.success ? result.data : result.error.flatten(),
      error: result.success
        ? (result.data.Error ?? "Windows system-wallpaper host rejected the operation.")
        : result.error.message,
      success: false,
    };
  }
  return {
    changed: Boolean(result.data.Applied || result.data.Restored),
    detail: result.data,
    success: true,
  };
}
