import { resolve } from "node:path";
import type { Configuration } from "electron-builder";
import { PACKAGED_APP_DIRECTORY, RELEASE_DIRECTORY } from "./lib/runtimePaths";

const root = __dirname;

const config = {
  appId: "com.momo.scopify",
  productName: "Scopify",
  publish: ["github"],
  artifactName: "${productName}.Setup.v${version}.${platform}.${arch}.${ext}",
  directories: {
    buildResources: "public",
    app: PACKAGED_APP_DIRECTORY,
    output: RELEASE_DIRECTORY,
  },
  compression: "maximum",
  electronLanguages: ["zh-CN", "en-US"],
  extraResources: [
    {
      from: "config",
      to: "config",
      filter: ["**/*.yml"],
    },
  ],
  files: [
    "out/main/**/*.js",
    "renderer/**/*",
    "package.json",
    "public/**/*",
    "!**/node_modules",
    "!**/*.map",
  ],
  asarUnpack: ["public/**/*"],
  win: {
    executableName: "Scopify",
    extraResources: [
      {
        from: "native/audio-engine",
        to: "native/audio-engine",
        filter: ["scopify-audio-engine.win32-${arch}-msvc.node", "index.d.ts"],
      },
      {
        from: "native/taskbar-lyric",
        to: "native/taskbar-lyric",
        filter: ["scopify-taskbar-lyric.win32-${arch}-msvc.node"],
      },
      {
        from: "native/wallpaper-helper",
        to: "native/wallpaper-helper",
        filter: ["scopify-wallpaper-helper.win32-${arch}-msvc.node"],
      },
    ],
    target: [
      {
        target: "nsis",
        arch: ["x64", "arm64"],
      },
    ],
    icon: resolve(root, "public/icons/icon.ico"),
    requestedExecutionLevel: "asInvoker",
  },
  mac: {
    extraResources: [
      {
        from: "native/wallpaper-helper",
        to: "native/wallpaper-helper",
        filter: ["scopify-wallpaper-helper.darwin-${arch}.node"],
      },
    ],
    target: [
      {
        target: "dmg",
        arch: ["arm64", "x64"],
      },
      {
        target: "zip",
        arch: ["arm64", "x64"],
      },
    ],
    icon: resolve(root, "public/icons/icon.icns"),
    category: "public.app-category.music",
    // Sign the complete bundle even when no Developer ID certificate is available.
    identity: "-",
    hardenedRuntime: false,
    gatekeeperAssess: false,
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    deleteAppDataOnUninstall: true,
    installerIcon: resolve(root, "public/icons/icon.ico"),
    uninstallerIcon: resolve(root, "public/icons/uninstall.ico"),
    shortcutName: "Scopify",
    uninstallDisplayName: "Scopify",
    createDesktopShortcut: "always",
  },
} satisfies Configuration;

export default config;
