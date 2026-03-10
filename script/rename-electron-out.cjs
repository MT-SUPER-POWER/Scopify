const fs = require("fs");
const path = require("path");

const outDir = path.join(__dirname, "..", "out");
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
