import { resolve } from "node:path";
import { defineConfig } from "electron-vite";

const root = __dirname;

export default defineConfig({
  main: {
    resolve: {
      alias: {
        "@": root,
      },
    },
    build: {
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
      outDir: "out/main",
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
