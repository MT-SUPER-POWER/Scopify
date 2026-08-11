import { resolve } from "node:path";
import { defineConfig } from "electron-vite";

const root = __dirname;
const packagedAppRoot = resolve(root, "../../../build/desktop/app");
const runtimeOutDir = resolve(packagedAppRoot, "out/main");

export default defineConfig({
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
      externalizeDeps: {
        exclude: ["@scopify/desktop-contract"],
      },
      outDir: runtimeOutDir,
      emptyOutDir: false,
      rollupOptions: {
        input: {
          preload: resolve(root, "main/preload.ts"),
        },
        output: {
          entryFileNames: "[name].js",
          format: "cjs",
        },
      },
    },
  },
});
