import { resolve } from "node:path";
import { defineConfig } from "electron-vite";
import { resolveElectronOutputDirectory } from "./lib/runtimePaths";

const root = __dirname;

// electron-vite's isolated-entry progress reporter assumes an interactive TTY.
// Keep CI and other captured-output builds functional without weakening sandboxing.
Object.assign(process.stdout, {
  clearLine: process.stdout.clearLine ?? (() => true),
  cursorTo: process.stdout.cursorTo ?? (() => true),
  moveCursor: process.stdout.moveCursor ?? (() => true),
});

export default defineConfig(({ command }) => {
  const runtimeOutDir = resolveElectronOutputDirectory(root, command);

  return {
    main: {
      resolve: {
        alias: {
          "@": root,
        },
      },
      build: {
        emptyOutDir: true,
        outDir: runtimeOutDir,
        externalizeDeps: {
          exclude: ["@scopify/desktop-contract"],
        },
        rollupOptions: {
          input: {
            main: resolve(root, "main/main.ts"),
          },
          output: {
            entryFileNames: "[name].js",
            format: "es",
          },
        },
      },
    },
    preload: {
      resolve: {
        alias: {
          "@": root,
        },
      },
      build: {
        externalizeDeps: false,
        isolatedEntries: true,
        outDir: runtimeOutDir,
        emptyOutDir: false,
        rollupOptions: {
          input: {
            preload: resolve(root, "main/preload.ts"),
            playbackHostPreload: resolve(root, "main/playbackHostPreload.ts"),
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
