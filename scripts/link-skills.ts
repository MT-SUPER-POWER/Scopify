import {
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readlinkSync,
  realpathSync,
  renameSync,
  symlinkSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = realpathSync(fileURLToPath(new URL("../", import.meta.url)));
const sourceRoot = join(root, "skills");
const agentDirectories = [".agents", ".claude", ".cursor", ".gemini", ".opencode"];
const isWindows = process.platform === "win32";

function entryAt(path: string) {
  return lstatSync(path, { throwIfNoEntry: false });
}

function ensureDirectory(path: string) {
  const entry = entryAt(path);
  if (!entry) {
    mkdirSync(path);
  } else if (!entry.isDirectory()) {
    throw new Error(`${relative(root, path)} 必须是项目内的普通目录`);
  }
}

function pointsToSource(destination: string, entry: ReturnType<typeof entryAt>, source: string) {
  if (!entry?.isSymbolicLink()) return false;
  const target = resolve(dirname(destination), readlinkSync(destination));
  return relative(source, target) === "";
}

function createLink(source: string, destination: string) {
  if (isWindows) {
    symlinkSync(source, destination, "junction");
  } else {
    symlinkSync(relative(dirname(destination), source), destination, "dir");
  }
}

function linkSkills(agentDirectory: string, skills: string[], replace: boolean) {
  const agentRoot = join(root, agentDirectory);
  const targetRoot = join(agentRoot, "skills");
  ensureDirectory(agentRoot);
  ensureDirectory(targetRoot);
  let backupRoot: string | undefined;

  for (const name of skills) {
    const source = join(sourceRoot, name);
    const destination = join(targetRoot, name);
    const entry = entryAt(destination);
    if (pointsToSource(destination, entry, source)) continue;
    const label = relative(root, destination);

    if (!entry) {
      createLink(source, destination);
      console.log(`已链接 ${label}`);
      continue;
    }
    if (!replace) {
      console.error(`已保留 ${label}，用 --replace 备份原项后替换。`);
      process.exitCode = 1;
      continue;
    }

    backupRoot ??= mkdtempSync(join(agentRoot, "skills-backup-"));
    const backup = join(backupRoot, name);
    renameSync(destination, backup);
    try {
      createLink(source, destination);
    } catch (error) {
      renameSync(backup, destination);
      throw error;
    }
    console.log(`已链接 ${label}，原项备份到 ${relative(root, backup)}`);
  }
}

const args = process.argv.slice(2);
const replace = args.includes("--replace");
const targets = args.filter((arg) => arg !== "--replace");
if (targets.some((target) => !agentDirectories.includes(target))) {
  console.error(`用法：bun scripts/link-skills.ts [--replace] [${agentDirectories.join(" | ")}] …`);
  process.exitCode = 1;
} else {
  try {
    if (!entryAt(sourceRoot)?.isDirectory()) {
      throw new Error("项目根目录下的 skills/ 必须是普通目录");
    }
    const skills = readdirSync(sourceRoot, { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isDirectory() && entryAt(join(sourceRoot, entry.name, "SKILL.md"))?.isFile(),
      )
      .map((entry) => entry.name);
    for (const target of new Set(targets.length ? targets : [".agents", ".claude"])) {
      linkSkills(target, skills, replace);
    }
  } catch (error) {
    console.error(`创建 skill 链接失败：${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
