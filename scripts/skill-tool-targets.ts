import { randomUUID } from "node:crypto";
import { lstatSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type ToolTarget = { label: string; directory: string };

const configName = ".skill-tool-targets.json";
const builtInTools: ToolTarget[] = [
  { label: "Codex", directory: ".agents/skills" },
  { label: "Claude Code", directory: ".claude/skills" },
  { label: "Cursor", directory: ".cursor/skills" },
  { label: "Gemini CLI", directory: ".gemini/skills" },
  { label: "OpenCode", directory: ".opencode/skills" },
];
const reservedDirectories = new Set([".git", ".worktrees", "node_modules"]);

export function normalizeToolDirectory(input: string) {
  const directory = input.trim().replaceAll("\\", "/").replace(/\/+$/, "").replace(/^\.\//, "");
  const segments = directory.toLowerCase().split("/");

  if (
    segments[0] === "skills" ||
    segments.some(
      (part) =>
        !/^[a-z0-9_. -]+$/.test(part) ||
        part.startsWith(" ") ||
        part.endsWith(" ") ||
        part.endsWith(".") ||
        /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/.test(part) ||
        reservedDirectories.has(part),
    )
  ) {
    throw new Error("请输入仓库内的 skills 目录，例如 .my-ai/skills。");
  }
  return directory;
}

export function validateToolDirectory(directory: string, tools: readonly ToolTarget[]) {
  const normalized = normalizeToolDirectory(directory).toLowerCase();
  for (const tool of tools) {
    const existing = tool.directory.toLowerCase();
    if (
      normalized === existing ||
      normalized.startsWith(`${existing}/`) ||
      existing.startsWith(`${normalized}/`)
    ) {
      throw new Error(`该路径与 ${tool.label}（${tool.directory}）重叠。`);
    }
  }
}

function readCustomTools(root: string): ToolTarget[] {
  const path = join(root, configName);
  const entry = lstatSync(path, { throwIfNoEntry: false });
  if (!entry) return [];
  if (!entry.isFile()) throw new Error(`${configName} 必须是普通文件。`);

  const data: unknown = JSON.parse(readFileSync(path, "utf8"));
  if (!Array.isArray(data)) throw new Error(`${configName} 必须包含一个工具列表。`);

  const tools: ToolTarget[] = [];
  for (const item of data as unknown[]) {
    if (
      !item ||
      typeof item !== "object" ||
      !("label" in item) ||
      typeof item.label !== "string" ||
      !item.label.trim() ||
      !("directory" in item) ||
      typeof item.directory !== "string"
    ) {
      throw new Error(`${configName} 中的每个工具都需要名称和目录。`);
    }
    const directory = normalizeToolDirectory(item.directory);
    validateToolDirectory(directory, [...builtInTools, ...tools]);
    tools.push({ label: item.label, directory });
  }
  return tools;
}

export function readToolTargets(root: string) {
  return [...builtInTools, ...readCustomTools(root)];
}

export function saveToolTarget(root: string, tool: ToolTarget) {
  const tools = readCustomTools(root);
  validateToolDirectory(tool.directory, [...builtInTools, ...tools]);
  const path = join(root, configName);
  const stagedPath = join(root, `${configName}.${randomUUID()}.tmp`);
  writeFileSync(stagedPath, `${JSON.stringify([...tools, tool], null, 2)}\n`, { flag: "wx" });
  try {
    renameSync(stagedPath, path);
  } finally {
    if (lstatSync(stagedPath, { throwIfNoEntry: false })) unlinkSync(stagedPath);
  }
}
