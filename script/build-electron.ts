import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const root = path.join(import.meta.dirname ?? path.dirname(new URL(import.meta.url).pathname), "..");
const out = path.join(root, "out");

// 单独编译 preload（用 commonjs 配置）
execSync(
    `npx swc main/preload.ts -o out/main/preload.js --config-file swcrc.preload.json`,
    { cwd: root, stdio: "inherit" }
);
console.log("[build-electron] preload compiled as CJS.");

// 写入 ESM 标识，与新架构保持一致
fs.writeFileSync(
    path.join(out, "package.json"),
    JSON.stringify({ type: "module" }, null, 2)
);

console.log("[build-electron] out/package.json synced.");
