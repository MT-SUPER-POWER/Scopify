import { resolve } from "node:path";

export type ElectronBuildCommand = "build" | "serve";

export function resolveElectronOutputDirectory(desktopRoot: string, command: ElectronBuildCommand) {
  if (command === "serve") return resolve(desktopRoot, "out/main");
  return resolve(desktopRoot, "build/desktop/app/out/main");
}
