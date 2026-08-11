import { readFileSync } from "node:fs";
import { join, relative } from "node:path";

const targetPatterns = [
  "app/layout.tsx",
  "app/(dashboard)/**/*.tsx",
  "components/Sidebar.tsx",
  "components/Siderbar/**/*.tsx",
  "components/Login/**/*.tsx",
  "components/album/**/*.tsx",
  "components/artist/**/*.tsx",
  "components/auth/**/*.tsx",
  "components/home/**/*.tsx",
  "components/Comment/**/*.tsx",
  "components/library/**/*.tsx",
  "components/profile/**/*.tsx",
  "components/MainLayout.tsx",
  "components/MainLayout/**/*.tsx",
  "components/PlayerBar.tsx",
  "components/PlayBar/ProgressBar.tsx",
  "components/player/**/*.tsx",
  "components/Playlist/ActionStation.tsx",
  "components/Playlist/Header.tsx",
  "components/Playlist/HeaderSkeleton.tsx",
  "components/Playlist/PlaylistContent.tsx",
  "components/Playlist/PlaylistForm.tsx",
  "components/Playlist/PlaylistLoading.tsx",
  "components/Playlist/PlaylistPageSkeleton.tsx",
  "components/Playlist/PlaylistTagSelector.tsx",
  "components/Playlist/TableConfirmDialog.tsx",
  "components/Playlist/TrackRow.tsx",
  "components/Playlist/TrackTable.tsx",
  "components/SmoothSlider.tsx",
  "components/VolumeControl.tsx",
  "components/Header.tsx",
  "components/Header/Avatar.tsx",
  "components/Header/ProfileMenu.tsx",
  "components/Header/RightActions.tsx",
  "components/Header/UpdateNotificationCenter.tsx",
  "components/SearchContents/**/*.tsx",
  "components/search/**/*.tsx",
  "components/shared/**/*.tsx",
  "components/shared/HeaderDescription.tsx",
  "components/shared/MediaDescriptionDialog.tsx",
  "components/shared/NetworkRetryState.tsx",
  "components/shared/ResponsiveHeaderTitle.tsx",
  "components/shared/RouteScrollSurface.tsx",
  "components/shared/SongContextMenu.tsx",
  "components/shared/SongTitleWithAlia.tsx",
  "components/shared/TrackIndexCell.tsx",
  "components/shared/TracklistResizeHandle.tsx",
  "components/settings/AppearanceModeControl.tsx",
  "components/settings/SettingsUI.tsx",
  "components/settings/SettingsPage.tsx",
  "components/settings/GeneralSettingsTab.tsx",
  "components/settings/NetworkSettingsTab.tsx",
  "components/settings/StorageSettingsTab.tsx",
  "components/settings/DesktopSettingsTab.tsx",
  "components/ui/**/*.tsx",
  "components/voice/**/*.tsx",
  "hooks/home/useHomeData.ts",
];

const bannedPatterns = [
  /#[0-9a-fA-F]{3,8}\b/,
  /\b(?:bg|text|border|ring|outline|fill|stroke|from|via|to)-(?:black|white|zinc|gray|neutral|stone|slate|green|red|orange|yellow|blue|purple|pink|emerald|indigo)(?:-\d{1,3})?(?:\/(?:\d{1,3}|\[[^\]]+\]))?\b/,
  /\b(?:bg|text|border|ring|outline|fill|stroke)-\[(?:#|rgb|hsl|oklch)/,
  /\brounded-\[(?!inherit\])[^\]]+\]/,
  /\bfont-\[[^\]]+\]/,
  /\bshadow-\[[^\]]+\]/,
  /fontFamily\s*:/,
];

const files = new Set<string>();

for (const pattern of targetPatterns) {
  for (const filePath of new Bun.Glob(pattern).scanSync({ cwd: process.cwd(), onlyFiles: true })) {
    files.add(filePath);
  }
}

const findings: string[] = [];

for (const filePath of files) {
  const absolutePath = join(process.cwd(), filePath);
  const relativePath = relative(process.cwd(), absolutePath);
  const lines = readFileSync(absolutePath, "utf8").split(/\r?\n/);

  lines.forEach((line, index) => {
    if (!bannedPatterns.some((pattern) => pattern.test(line))) return;
    findings.push(`${relativePath}:${index + 1}: ${line.trim()}`);
  });
}

if (findings.length === 0) {
  console.log("Theme hardcode guard passed.");
  process.exit(0);
}

console.error("Theme hardcode guard found a raw visual value:");
for (const finding of findings) {
  console.error(finding);
}
console.error("Use a semantic Tailwind token from app/globals.css instead.");
process.exit(1);
