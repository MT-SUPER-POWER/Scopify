import { resolve } from "node:path";
import { defineConfig } from "electron-vite";
import { resolveElectronOutputDirectory } from "./lib/runtimePaths";

const root = __dirname;

export default defineConfig(({ command }) => {
  const runtimeOutDir = resolveElectronOutputDirectory(root, command);

  return {
    main: {
      resolve: {
        alias: {
          "@": root,
          "@main": resolve(root, "electron/main"),
        },
      },
      build: {
        emptyOutDir: true,
        outDir: runtimeOutDir,
        externalizeDeps: false,
        rollupOptions: {
          input: {
            main: resolve(root, "electron/main/index.ts"),
          },
          external: ["bufferutil", "utf-8-validate"],
          output: {
            entryFileNames: "[name].js",
            format: "es",
          },
        },
      },
    },
    preload: {
      build: {
        externalizeDeps: false,
        outDir: runtimeOutDir,
        emptyOutDir: false,
        rollupOptions: {
          input: {
            preload: resolve(root, "electron/preload/index.ts"),
          },
          output: {
            entryFileNames: "[name].js",
            format: "cjs",
          },
        },
      },
    },
  };
});
