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
    {
      from: "prototypes/desktop-wallpaper-host-spike",
      to: "desktop-wallpaper-host-spike",
      filter: ["system-wallpaper.ps1"],
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
        filter: ["*.node", "index.d.ts"],
      },
      {
        from: "native/wallpaper-helper/target/release/scopify-wallpaper-helper.exe",
        to: "scopify-wallpaper-helper.exe",
      },
    ],
    target: ["nsis"],
    icon: resolve(root, "public/icons/icon.ico"),
    requestedExecutionLevel: "asInvoker",
  },
  mac: {
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
