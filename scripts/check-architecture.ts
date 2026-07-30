import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, isAbsolute, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

export interface ArchitectureViolation {
  file: string;
  message: string;
}

const SOURCE_EXTENSIONS = new Set([".js", ".jsx", ".mjs", ".ts", ".tsx"]);
const IGNORED_DIRECTORIES = new Set([
  ".next",
  "coverage",
  "dist",
  "node_modules",
  "out",
  "renderer",
]);

const WEB_RUNTIME_COMPOSITION_ROOT = "frontend/apps/web/lib/runtime/index.ts";
const WEB_ELECTRON_DECLARATION = "frontend/apps/web/types/electron.d.ts";
const BANNED_WEB_RUNTIME_PATTERNS = [
  { expression: /\bwindow\s*\.\s*electronAPI\b/, label: "window.electronAPI" },
  { expression: /\bIS_ELECTRON\b/, label: "IS_ELECTRON" },
  { expression: /\bIS_WEB\b/, label: "IS_WEB" },
  { expression: /\bisElectron\s*\(/, label: "isElectron()" },
] as const;

const IMPORT_SPECIFIER_PATTERN =
  /(?:\b(?:import|export)\s+(?:[^"']*?\s+from\s*)?|\bimport\s*\(|\brequire\s*\()\s*["']([^"']+)["']/g;

function toPosix(path: string): string {
  return path.split(sep).join("/");
}

function isWithin(parent: string, candidate: string): boolean {
  const pathFromParent = relative(parent, candidate);
  return (
    pathFromParent === "" ||
    (!pathFromParent.startsWith(`..${sep}`) &&
      pathFromParent !== ".." &&
      !isAbsolute(pathFromParent))
  );
}

function listSourceFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) return [];

    const entryPath = resolve(directory, entry.name);
    if (entry.isDirectory()) return listSourceFiles(entryPath);
    return SOURCE_EXTENSIONS.has(extname(entry.name)) ? [entryPath] : [];
  });
}

export function findForbiddenWebRuntimeUsage(
  repositoryRelativePath: string,
  source: string,
): ArchitectureViolation[] {
  const normalizedPath = toPosix(repositoryRelativePath);
  if (
    normalizedPath === WEB_RUNTIME_COMPOSITION_ROOT ||
    normalizedPath === WEB_ELECTRON_DECLARATION ||
    normalizedPath.includes("/tests/") ||
    normalizedPath.endsWith(".test.ts") ||
    normalizedPath.endsWith(".test.tsx")
  ) {
    return [];
  }

  return BANNED_WEB_RUNTIME_PATTERNS.flatMap(({ expression, label }) =>
    expression.test(source)
      ? [
          {
            file: normalizedPath,
            message: `${label} is only allowed in the Web Runtime composition root`,
          },
        ]
      : [],
  );
}

export function findForbiddenDesktopImports(
  repositoryRoot: string,
  absoluteFilePath: string,
  source: string,
): ArchitectureViolation[] {
  const webRoot = resolve(repositoryRoot, "frontend/apps/web");
  const file = toPosix(relative(repositoryRoot, absoluteFilePath));
  const violations: ArchitectureViolation[] = [];

  for (const match of source.matchAll(IMPORT_SPECIFIER_PATTERN)) {
    const specifier = match[1];
    if (!specifier) continue;

    const importsWebPackage = specifier === "@scopify/web" || specifier.startsWith("@scopify/web/");
    const importsWebPath = specifier.replaceAll("\\", "/").includes("frontend/apps/web");
    const resolvesIntoWeb = specifier.startsWith(".")
      ? isWithin(webRoot, resolve(dirname(absoluteFilePath), specifier))
      : false;

    if (importsWebPackage || importsWebPath || resolvesIntoWeb) {
      violations.push({
        file,
        message: `Desktop cannot import Web source: ${specifier}`,
      });
    }
  }

  return violations;
}

export function checkArchitecture(repositoryRoot = resolve(import.meta.dir, "..")) {
  const webRoot = resolve(repositoryRoot, "frontend/apps/web");
  const desktopRoot = resolve(repositoryRoot, "frontend/apps/desktop");

  const webViolations = listSourceFiles(webRoot).flatMap((file) =>
    findForbiddenWebRuntimeUsage(
      toPosix(relative(repositoryRoot, file)),
      readFileSync(file, "utf8"),
    ),
  );
  const desktopViolations = listSourceFiles(desktopRoot).flatMap((file) =>
    findForbiddenDesktopImports(repositoryRoot, file, readFileSync(file, "utf8")),
  );

  return [...webViolations, ...desktopViolations];
}

function main() {
  const violations = checkArchitecture();
  if (violations.length === 0) {
    console.log("Architecture boundaries are valid.");
    return;
  }

  console.error("Architecture boundary violations:");
  for (const violation of violations) {
    console.error(`- ${violation.file}: ${violation.message}`);
  }
  process.exitCode = 1;
}

if (import.meta.main || import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main();
}
