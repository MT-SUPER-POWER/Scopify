import { ensureElectronInstalled } from "@/lib/electron-install";

if (process.env.SCOPIFY_SKIP_ELECTRON_INSTALL === "1") {
  console.log("Skipping Electron binary install.");
  process.exit(0);
}

try {
  ensureElectronInstalled();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
