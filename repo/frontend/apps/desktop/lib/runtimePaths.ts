import { resolve } from "node:path";

export type ElectronBuildCommand = "build" | "serve";

export const PACKAGED_APP_DIRECTORY = "build/desktop/app";
export const RELEASE_DIRECTORY = "build/release";

export function resolvePackagedAppDirectory(desktopRoot: string) {
  return resolve(desktopRoot, PACKAGED_APP_DIRECTORY);
}

export function resolvePackagedRendererDirectory(desktopRoot: string) {
  return resolve(resolvePackagedAppDirectory(desktopRoot), "renderer");
}

export function resolveElectronOutputDirectory(desktopRoot: string, command: ElectronBuildCommand) {
  if (command === "serve") return resolve(desktopRoot, "out/main");
  return resolve(resolvePackagedAppDirectory(desktopRoot), "out/main");
}
