import type { LucideIcon } from "lucide-react";
import type { SHORTCUT_COMMAND_DEFINITIONS } from "@/constants/shortcuts";
import type { TranslationKey } from "@/lib/i18n";
import type { CommandUsageRecord } from "@/types/commandWorkspace/search";

export interface ShortcutCommandIconProps {
  className?: string;
  commandId: string;
}

export type ShortcutCommandId = (typeof SHORTCUT_COMMAND_DEFINITIONS)[number]["id"];

export type ShortcutGroup = "playback" | "interface" | "shortcuts";
export type ShortcutScope = "global" | "playlist";

export interface ShortcutBinding {
  key: string;
  primary?: boolean;
  alt?: boolean;
  shift?: boolean;
}

export interface ShortcutCommandContract {
  id: string;
  group: ShortcutGroup;
  labelKey: TranslationKey;
  keywords?: string;
  /** `null` leaves the command unassigned until the user records a binding. */
  defaultBinding: ShortcutBinding | null;
  scope?: ShortcutScope;
  icon: LucideIcon;
  isAvailable?: (context: ShortcutAvailabilityContext) => boolean;
  execute(context: ShortcutActionContext): void | Promise<void>;
  /** False for commands already represented by a workspace/tree entry. */
  showInCommandWorkspace?: boolean;
  commandWorkspaceLabelSuffix?: string;
  desktopController?: boolean;
  /** Preserve the listener's focus and repeat policies alongside the command. */
  focus?: "non-editable" | "anywhere" | "volume";
  allowRepeat?: boolean;
}

export interface ShortcutCommandDefinition extends ShortcutCommandContract {
  id: ShortcutCommandId;
}

/** Page state that decides whether a command is offered in the command palette. */
export interface ShortcutAvailabilityContext {
  latticeActive: boolean;
  latticeAvailable: boolean;
}

export interface ShortcutCommandExecutorOptions {
  navigateTo?(path: string): void;
  focusPlaylistSearch?(): void;
}

export type ShortcutOverrides = Partial<Record<ShortcutCommandId, ShortcutBinding | null>>;
export type ShortcutUsageCounts = Partial<Record<ShortcutCommandId, number>>;

export interface ShortcutStoreState {
  /** 命令面板里每条命令的使用次数与最近使用时间，用于频率排序。 */
  commandUsage: CommandUsageRecord;
  overrides: ShortcutOverrides;
  usageCounts: ShortcutUsageCounts;
  recordCommandUsage: (id: string) => void;
  setOverride: (commandId: ShortcutCommandId, binding: ShortcutBinding | null) => void;
  resetOverride: (commandId: ShortcutCommandId) => void;
  resetAllOverrides: () => void;
  incrementUsage: (commandId: ShortcutCommandId) => void;
}

export type ShortcutAssignmentResult =
  { ok: true } | { ok: false; conflictCommandId: ShortcutCommandId };

export interface InWindowShortcutsOptions {
  commandIds?: readonly ShortcutCommandId[];
  executeCommand?: (commandId: ShortcutCommandId) => void;
  scope?: ShortcutScope;
}

/** Business capabilities injected into declarations; reads current state at execution time. */
export interface ShortcutActionContext {
  playback: {
    toggle(): void;
    toggleLike(): void;
    previous(): void;
    next(): void;
    adjustVolume(delta: number): void;
    toggleMute(): void;
    seekBy(deltaMs: number): void;
  };
  navigation: {
    navigateTo(path: string): void;
    navigateHome(): void;
    back(): void;
    forward(): void;
  };
  ui: {
    toggleSearch(): void;
    toggleCommandPalette(): void;
    toggleSidebar(): void;
    toggleQueue(): void;
    toggleNowPlayingPanel(): void;
    toggleShortcutHelp(): void;
  };
  folia: {
    toggleLyricStage(): void;
    toggleStageSettings(): void;
    openFoliaSettings(): void;
    openFoliaThemeLibrary(): void;
  };
  audio: {
    toggleAudioSettings(): void;
    toggleAudioOutputDevice(): void;
  };
  desktop: {
    reloadWindow(): void;
    toggleDynamicIsland(): void;
    toggleTaskbarLyric(): void;
    toggleDesktopSubtitle(): void;
    toggleSubtitleControls(): void;
    toggleDesktopController(): void;
    toggleDesktopMusicMode(): void;
    toggleFullscreen(): void;
    toggleDeveloperTools(): void;
  };
  lattice: {
    viewList(): void;
    viewLattice(): void;
    toggleLightsOff(): void;
  };
  playlist: { focusSearch(): void };
  track: { openCurrentComments(): void };
  updates: { openWhatsNew(): void };
}
