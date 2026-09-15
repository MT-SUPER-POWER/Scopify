import type { Configuration } from "electron-builder";
import { PACKAGED_APP_DIRECTORY, RELEASE_DIRECTORY } from "./lib/runtimePaths";

const config = {
  appId: "com.momo.scopify",
  productName: "Scopify",
  publish: ["github"],
  artifactName: "${productName}.Setup.v${version}.${platform}.${arch}.${ext}",
  directories: {
    app: PACKAGED_APP_DIRECTORY,
    output: RELEASE_DIRECTORY,
  },
  electronDist: "node_modules/electron/dist",
  compression: "maximum",
  extraResources: [
    {
      from: "config",
      to: "config",
      filter: ["**/*.yml"],
    },
    {
      from: "resources",
      to: "resources",
      filter: ["**/*"],
    },
    {
      from: "prototypes/desktop-wallpaper-host-spike",
      to: "desktop-wallpaper-host-spike",
      filter: ["system-wallpaper.ps1"],
    },
  ],
  files: ["out/main/**/*.js", "renderer/**/*", "package.json", "!**/node_modules", "!**/*.map"],
  win: {
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
    icon: "resources/icon.ico",
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
    icon: "resources/icon.icns",
    category: "public.app-category.music",
    hardenedRuntime: false,
    gatekeeperAssess: false,
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    deleteAppDataOnUninstall: true,
  },
} satisfies Configuration;

export default config;
