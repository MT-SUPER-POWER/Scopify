import { resolve } from "node:path";
import { defineConfig } from "electron-vite";
import { resolveElectronOutputDirectory } from "./lib/runtimePaths";

const root = __dirname;

export default defineConfig(({ command }) => {
  const runtimeOutDir = resolveElectronOutputDirectory(root, command);

  return {
    main: {
      publicDir: resolve(root, "public"),
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
          onwarn(warning, defaultHandler) {
            // zod 4 的 `@__PURE__` 注释位置 Rollup 无法识别，只会被丢弃、不影响产物，静默这类第三方噪音。
            if (warning.code === "INVALID_ANNOTATION" && warning.id?.includes("node_modules"))
              return;
            defaultHandler(warning);
          },
          external: [
            "bufferutil",
            "utf-8-validate",
            "@neteasecloudmusicapienhanced/api",
            /^@neteasecloudmusicapienhanced\/api(\/.*)?$/,
          ],
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
        // 与 Main 共用目录，保留先生成的主进程产物。
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
