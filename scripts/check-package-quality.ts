import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const IGNORED_DIRECTORIES = new Set(["node_modules", ".turbo", "coverage", "dist", "build"]);

function hasTests(directory: string): boolean {
  return readdirSync(directory, { withFileTypes: true }).some((entry) => {
    if (entry.isDirectory()) {
      return !IGNORED_DIRECTORIES.has(entry.name) && hasTests(resolve(directory, entry.name));
    }
    return /\.(test|spec)\.[cm]?[jt]sx?$/.test(entry.name);
  });
}

export function checkPackageQuality(
  packagesRoot = resolve(import.meta.dir, "../repo/frontend/packages"),
): string[] {
  const violations: string[] = [];
  for (const entry of readdirSync(packagesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || IGNORED_DIRECTORIES.has(entry.name)) continue;
    const packageRoot = resolve(packagesRoot, entry.name);
    const manifestPath = resolve(packageRoot, "package.json");
    if (!existsSync(manifestPath)) {
      violations.push(`${entry.name}: missing package.json`);
      continue;
    }
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    const requiredScripts = hasTests(packageRoot)
      ? ["lint", "typecheck", "test"]
      : ["lint", "typecheck"];
    for (const name of requiredScripts) {
      if (typeof manifest.scripts?.[name] !== "string" || !manifest.scripts[name].trim()) {
        violations.push(`${manifest.name ?? entry.name}: missing ${name} script`);
      }
    }
    if (!existsSync(resolve(packageRoot, "tsconfig.json"))) {
      violations.push(`${manifest.name ?? entry.name}: missing tsconfig.json`);
    }
  }
  return violations;
}

if (import.meta.main) {
  const violations = checkPackageQuality();
  if (violations.length) {
    console.error(violations.join("\n"));
    process.exitCode = 1;
  } else {
    console.log("Shared packages declare lint, typecheck, and test scripts where tests exist.");
  }
}
