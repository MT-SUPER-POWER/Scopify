import { readFileSync } from "node:fs";
import { join, relative } from "node:path";

const roots = ["app", "components"];
const ignoredFiles = new Set([
  "app\\(dashboard)\\me\\page.tsx",
  "components\\Playlist\\ControlPanel.tsx",
]);
const allowPatterns = [
  /Scopify/,
  /GitHub/i,
  /https?:\/\//,
  /className=/,
  /console\./,
  /Promise</,
  /onConfirm:/,
  /onSendCaptcha:/,
  /onSubmit:/,
  /selectedIndex/,
  /prev < items\.length/,
  /TIME_THEME_MAP\.find/,
  /^\s*\/\//,
  /^\s*\*/,
];

const suspiciousPatterns = [
  /toast\.(success|error|info|warning)\((["'`]).*?[A-Za-z\u4e00-\u9fff].*?\2/,
  /(placeholder|title|alt)=["'][^"']*[A-Za-z\u4e00-\u9fff][^"']*["']/,
  />\s*[^<{][^<{]*[A-Za-z\u4e00-\u9fff][^<{]*</,
];

function listFiles(dir: string): string[] {
  const paths: string[] = [];
  const stack = [dir];

  while (stack.length > 0) {
    const current = stack.pop()!;
    for (const entry of new Bun.Glob("**/*.{ts,tsx}").scanSync({ cwd: current, onlyFiles: true })) {
      paths.push(join(current, entry));
    }
  }

  return Array.from(new Set(paths));
}

const findings: string[] = [];

for (const root of roots) {
  for (const filePath of listFiles(root)) {
    const relativePath = relative(process.cwd(), filePath);
    if (ignoredFiles.has(relativePath)) continue;
    const source = readFileSync(filePath, "utf8");
    const lines = source.split(/\r?\n/);

    lines.forEach((line, index) => {
      if (line.includes("t(") || line.includes("translate(")) return;
      if (allowPatterns.some((pattern) => pattern.test(line))) return;
      if (!suspiciousPatterns.some((pattern) => pattern.test(line))) return;
      findings.push(`${relativePath}:${index + 1}: ${line.trim()}`);
    });
  }
}

if (findings.length === 0) {
  console.log("No obvious hardcoded i18n candidates found.");
  process.exit(0);
}

console.log("Potential hardcoded i18n candidates:");
for (const finding of findings) {
  console.log(finding);
}

process.exit(1);
