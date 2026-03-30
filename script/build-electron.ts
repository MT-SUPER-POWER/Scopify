import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const root = path.join(import.meta.dirname ?? path.dirname(new URL(import.meta.url).pathname), "..");
const out = path.join(root, "out");

console.log("[build-electron] 开始编译 Electron 主进程...");

// 1. 编译除 preload 外的主进程代码 (使用默认的 ESM 配置)
execSync(
    `bunx swc main -d out --out-file-extension js --ignore main/preload.ts`,
    { cwd: root, stdio: "inherit" }
);
console.log("[build-electron] 主进程编译完成.");

// 2. 单独编译 preload (使用指定的 CJS 配置)
execSync(
    `bunx swc main/preload.ts -o out/main/preload.js --config-file swcrc.preload.json`,
    { cwd: root, stdio: "inherit" }
);
console.log("[build-electron] Preload 编译完成 (CJS).");

// 3. 写入 ESM 标识，与新架构保持一致
fs.writeFileSync(
    path.join(out, "package.json"),
    JSON.stringify({ type: "module" }, null, 2)
);
console.log("[build-electron] out/package.json 写入成功.");
