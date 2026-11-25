import { defineConfig } from "@x18n/cli";

const NAMESPACES = [
  "album",
  "appClose",
  "appearance",
  "artist",
  "audioEqualizer",
  "audioSettings",
  "comments",
  "common",
  "contextMenu",
  "desktopLyrics",
  "desktopPlaybackController",
  "devices",
  "dynamicIsland",
  "errorPage",
  "folia",
  "home",
  "layout",
  "library",
  "login",
  "lyrics",
  "mv",
  "network",
  "notifications",
  "nowPlaying",
  "personalFm",
  "playbar",
  "playerBar",
  "playlist",
  "privateMessages",
  "profile",
  "queue",
  "search",
  "settings",
  "shortcuts",
  "sidebar",
  "social",
  "song",
  "songResources",
  "subtitleControl",
  "subtitlePalette",
  "subtitlePreview",
  "subtitleSystem",
  "taskbarLyric",
  "themeEditor",
  "trackPreview",
  "tray",
  "ui",
  "updates",
  "vipSign",
] as const;

const CAPABILITY_EXCLUDES = [
  String.raw`playlist\.(?:read|manage|reorder)`,
  String.raw`library\.playlists`,
  String.raw`artist\.(?:read|follow)`,
  String.raw`album\.(?:read|subscribe)`,
  String.raw`home\.banners`,
  String.raw`mv\.interact`,
  String.raw`comments\.(?:read|write|replies)`,
  String.raw`search\.(?:overview|lyrics|match)`,
] as const;

const usageKeyPattern = [
  String.raw`(?<!operation: )(?<!event: )(?<!Symbol.for\()(?<!reportActionFailure\()["']`,
  `(?!(?:${CAPABILITY_EXCLUDES.join("|")})["'])`,
  `((?:${NAMESPACES.join("|")})\\.[a-zA-Z][a-zA-Z0-9._]+)["']`,
].join("");

export default defineConfig({
  sourceLocale: "zh-CN",
  locales: ["zh-CN", "zh-TW", "en-US"],
  presets: [],
  keyStyle: "flat",
  namespace: {
    separator: ".",
  },
  resources: [
    {
      pattern: "repo/frontend/apps/web/locales/{locale}/{namespace}.json",
    },
  ],
  checks: {
    "key-conflict": "off",
    "identical-to-source": "off",
  },
  extract: {
    ignore: ["**/styles/**", "**/lib/**", "**/types/**", "**/store/**", "**/constants/**"],
    ignoreCallees: ["cn", "clsx", "cva", "twMerge"],
    ignoreAttributes: [
      "className",
      "class",
      "style",
      "key",
      "id",
      "ref",
      "href",
      "src",
      "type",
      "name",
      "width",
      "height",
      "target",
      "rel",
      "d",
    ],
  },
  usage: {
    include: [
      "repo/frontend/apps/web/**/*.{ts,tsx}",
      "repo/frontend/packages/ui/folia/**/*.{ts,tsx}",
    ],
    exclude: [
      "repo/frontend/apps/web/tests/**",
      "repo/frontend/apps/web/scripts/**",
      "repo/frontend/apps/web/types/**",
    ],
    calls: [
      {
        callee: "t",
      },
      {
        callee: "translate",
        key: 1,
      },
    ],
    regex: [
      {
        extensions: ["ts", "tsx"],
        patterns: [usageKeyPattern],
      },
    ],
    keysInUse: ["library.listeningReport.timeOfDay.*"],
  },
});
