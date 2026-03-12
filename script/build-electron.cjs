const fs = require("fs");
const path = require("path");

const out = path.join(__dirname, "../out");
const config = path.join(__dirname, "../config");
const outConfig = path.join(out, "config");

// 写入 CommonJS 标识，覆盖 root 的 type: module
fs.writeFileSync(path.join(out, "package.json"), JSON.stringify({ type: "commonjs" }, null, 2));

// 同步配置文件
/* if (!fs.existsSync(outConfig)) fs.mkdirSync(outConfig, { recursive: true });
for (const file of fs.readdirSync(config)) {
    fs.copyFileSync(path.join(config, file), path.join(outConfig, file));
} */

console.log("[build-electron] out/package.json synced.");
