// Run the QQ Music API from its TypeScript sources, the same way its own `npm start` does.
// The package starts listening as an import side effect, so PORT must be set before loading it.
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const qqRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../repo/backend/qq-music-api");

process.env.PORT ||= "3200";
// Config files and the default `.auth-state` device file are resolved from the working directory.
process.chdir(qqRoot);

const qqRequire = createRequire(resolve(qqRoot, "package.json"));
qqRequire("ts-node").register({ project: resolve(qqRoot, "tsconfig.json"), transpileOnly: true });
qqRequire("./src/app.ts");
