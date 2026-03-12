const fs = require("fs");
const path = require("path");

const outDir = path.join(__dirname, "..", "out");
const mainSubDir = path.join(outDir, "main");

// 递归拷贝文件夹
function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach(element => {
    if (fs.lstatSync(path.join(from, element)).isFile()) {
      fs.copyFileSync(path.join(from, element), path.join(to, element));
    } else {
      copyFolderSync(path.join(from, element), path.join(to, element));
    }
  });
}

// 由于 tsconfig 的 rootDir: "."，输出会在 out/main/ 目录下。
// 我们需要将 out/main/ 下的所有内容移动到 out/ 根目录，
// 这样 main.cjs 才能正确引用到 ./module/ 等相对路径。
if (fs.existsSync(mainSubDir)) {
  console.log(`[rename-electron-out] Lifting content from ${mainSubDir} to ${outDir}...`);
  copyFolderSync(mainSubDir, outDir);
  // 然后再处理 main.js -> main.cjs 的逻辑
}

const targets = [
  { from: path.join(outDir, "main.js"), to: path.join(outDir, "main.cjs") },
  { from: path.join(outDir, "preload.js"), to: path.join(outDir, "preload.cjs") }
];

// Ensure compiled out/ is treated as CommonJS despite root type: module
const outPackageJson = path.join(outDir, "package.json");
const outPackageJsonContent = {
  type: "commonjs"
};

for (const { from, to } of targets) {
  if (fs.existsSync(from)) {
    try {
      fs.renameSync(from, to);
      console.log(`[rename-electron-out] ${path.basename(from)} -> ${path.basename(to)}`);
    } catch (err) {
      console.error(`[rename-electron-out] Failed to rename ${from}:`, err);
      process.exitCode = 1;
    }
  } else {
    console.warn(`[rename-electron-out] Skip missing ${path.basename(from)}`);
  }
}

try {
  fs.writeFileSync(outPackageJson, JSON.stringify(outPackageJsonContent, null, 2));
  console.log(`[rename-electron-out] wrote ${outPackageJson}`);
} catch (err) {
  console.error(`[rename-electron-out] Failed to write ${outPackageJson}:`, err);
  process.exitCode = 1;
}
