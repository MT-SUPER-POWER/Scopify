import type {
  PlaybackMediaRuntimeMode,
  PlaybackMediaRuntimeModeOptions,
} from "@/types/playbackHost";

/**
 * The dashboard has no media graph in the desktop renderer: its hidden sibling
 * owns the Authority. Browser deployments retain the in-page media runtime.
 */
export function resolveMainWindowPlaybackMediaRuntimeMode({
  isDesktop,
}: PlaybackMediaRuntimeModeOptions): PlaybackMediaRuntimeMode {
  return isDesktop ? "desktop-main-replica" : "in-page-authority";
}
