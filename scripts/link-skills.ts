import {
  lstatSync,
  type Stats,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readlinkSync,
  realpathSync,
  renameSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  cancel,
  confirm,
  intro,
  isCancel,
  multiselect as promptMultiselect,
  note,
  outro,
  select,
  text,
  type MultiSelectOptions,
} from "@clack/prompts";
import {
  normalizeToolDirectory,
  readToolTargets,
  saveToolTarget,
  validateToolDirectory,
  type ToolTarget,
} from "./skill-tool-targets";

const root = realpathSync(fileURLToPath(new URL("../", import.meta.url)));
const sourceRoot = join(root, "skills");

type LinkPlan = {
  name: string;
  directory: string;
  destination: string;
  source: string;
  entry: Stats | undefined;
  action: "Already linked" | "Link" | "Back up and link" | "Keep existing";
};

const actionLabels: Record<LinkPlan["action"], string> = {
  "Already linked": "已链接",
  Link: "链接",
  "Back up and link": "备份并链接",
  "Keep existing": "保留现有项",
};

function multiselect<Value>({ message, ...options }: MultiSelectOptions<Value>) {
  return promptMultiselect<Value>({
    ...options,
    message: `${message}\na 全选或清空  ·  i 反选`,
  });
}

function entryAt(path: string) {
  return lstatSync(path, { throwIfNoEntry: false });
}

function checkDirectory(path: string) {
  const entry = entryAt(path);
  if (entry && !entry.isDirectory()) {
    throw new Error(`${relative(root, path)} 必须是普通目录。`);
  }
  return entry;
}

/** Inspect each path component so tool directories cannot redirect writes through symlinks. */
function getToolDirectory(directory: string, create = false) {
  let path = root;
  for (const part of directory.split("/")) {
    path = join(path, part);
    if (checkDirectory(path)) continue;
    if (!create) return undefined;
    try {
      mkdirSync(path);
    } catch (error) {
      if (!checkDirectory(path)) throw error;
    }
  }
  return path;
}

function chooseTools(tools: ToolTarget[]) {
  return multiselect<string>({
    message: "选择 AI 工具",
    options: tools.map(({ label, directory }) => ({ value: directory, label, hint: directory })),
  });
}

function isSkillDirectory(path: string) {
  return entryAt(path)?.isDirectory() && entryAt(join(path, "SKILL.md"))?.isFile();
}

function pointsToSource(destination: string, entry: Stats | undefined, source: string) {
  if (!entry?.isSymbolicLink()) return false;
  const target = resolve(dirname(destination), readlinkSync(destination));
  return relative(source, target) === "";
}

function matchesPreview(current: Stats, entry: Stats | undefined) {
  if (!entry) return false;
  return (
    current.ino === entry.ino && current.dev === entry.dev && current.ctimeMs === entry.ctimeMs
  );
}

function createLink(source: string, destination: string) {
  if (process.platform === "win32") {
    symlinkSync(source, destination, "junction");
  } else {
    symlinkSync(relative(dirname(destination), source), destination, "dir");
  }
}

/** Move the conflicting entry aside and restore it if link creation fails and the path is free. */
function replaceEntry(source: string, destination: string, backup: string) {
  renameSync(destination, backup);
  try {
    createLink(source, destination);
  } catch (error) {
    if (!entryAt(destination)) renameSync(backup, destination);
    throw error;
  }
}

/** Show which selected entries need links, which are intact, and which need a backup. */
function planLinks(selectedTargets: string[], names: string[]): LinkPlan[] {
  return selectedTargets.flatMap((directory) => {
    const targetRoot = getToolDirectory(directory);

    return names.map((name) => {
      const source = join(sourceRoot, name);
      const destination = join(root, directory, name);
      const entry = targetRoot ? entryAt(destination) : undefined;
      const action = pointsToSource(destination, entry, source) ? "Already linked" : "Link";
      return { name, directory, source, destination, entry, action };
    });
  });
}

/** Apply selected links, checking for changes since the preview before replacing any entry. */
function applyLinks(plan: LinkPlan[]) {
  const backupRoots = new Map<string, string>();

  for (const item of plan) {
    const { action, directory, destination, source, entry, name } = item;
    if (action !== "Link" && action !== "Back up and link") continue;
    getToolDirectory(directory, true);
    const current = entryAt(destination);
    if (pointsToSource(destination, current, source)) continue;
    if (action === "Back up and link" && current) {
      if (!matchesPreview(current, entry)) {
        throw new Error(`${relative(root, destination)} 在预览后有变动，请重新运行。`);
      }
      const backupParent = dirname(dirname(destination));
      let backupRoot = backupRoots.get(backupParent);
      if (!backupRoot) {
        backupRoot = mkdtempSync(join(backupParent, "skills-backup-"));
        backupRoots.set(backupParent, backupRoot);
      }
      const backup = join(backupRoot, name);
      replaceEntry(source, destination, backup);
      note(relative(root, backup), "已备份");
    } else {
      createLink(source, destination);
    }
  }
}

/** Find links from selected tool directories to this checkout, including missing sources. */
function findProjectLinks(selectedTargets: string[]) {
  return selectedTargets.flatMap((directory) => {
    const targetRoot = getToolDirectory(directory);
    if (!targetRoot) return [];

    return readdirSync(targetRoot)
      .sort()
      .flatMap((name) => {
        const destination = join(targetRoot, name);
        const entry = entryAt(destination);
        const source = join(sourceRoot, name);
        return entry && pointsToSource(destination, entry, source)
          ? [{ directory, destination, source, entry }]
          : [];
      });
  });
}

/** Preview the selected removals and unlink only entries that still match the preview. */
async function unlinkProjectSkills(tools: ToolTarget[]) {
  const selectedTargets = await chooseTools(tools);
  if (isCancel(selectedTargets)) return cancel("已取消。");

  const links = findProjectLinks(selectedTargets);
  if (!links.length) return outro("所选工具没有项目 Skill 链接。");

  const sourceExists = entryAt(sourceRoot)?.isDirectory();
  const selectedLinks = await multiselect<ReturnType<typeof findProjectLinks>[number]>({
    message: "选择要移除的项目 Skill 链接",
    options: links.map((link) => ({
      value: link,
      label: relative(root, link.destination),
      hint: sourceExists && isSkillDirectory(link.source) ? undefined : "源 Skill 已缺失",
    })),
  });
  if (isCancel(selectedLinks)) return cancel("已取消。");

  note(
    selectedLinks.map(({ destination }) => `取消链接  ${relative(root, destination)}`).join("\n"),
    "预览",
  );
  const approved = await confirm({ message: "移除这些 Skill 链接？", initialValue: false });
  if (isCancel(approved) || !approved) return cancel("已取消。");

  let removed = 0;
  for (const { directory, destination, source, entry } of selectedLinks) {
    if (!getToolDirectory(directory)) continue;
    const current = entryAt(destination);
    if (!current) continue;
    if (!matchesPreview(current, entry) || !pointsToSource(destination, current, source)) {
      throw new Error(`${relative(root, destination)} 在预览后有变动，请重新运行。`);
    }
    unlinkSync(destination);
    removed++;
  }
  outro(removed ? `已移除 ${removed} 个 Skill 链接。` : "所选链接已移除。");
}

/** Collect a tool name and directory, then save the choice after confirmation. */
async function addTool(tools: ToolTarget[]) {
  const label = await text({
    message: "AI 工具名称",
    placeholder: "My AI",
    validate: (value) => (value?.trim() ? undefined : "请输入工具名称。"),
  });
  if (isCancel(label)) return false;

  const input = await text({
    message: "项目内的 Skill 目录",
    placeholder: ".my-ai/skills",
    validate(value) {
      try {
        const directory = normalizeToolDirectory(value ?? "");
        validateToolDirectory(directory, tools);
        getToolDirectory(directory);
      } catch (error) {
        return error instanceof Error ? error.message : String(error);
      }
    },
  });
  if (isCancel(input)) return false;

  const tool = { label: label.trim(), directory: normalizeToolDirectory(input) };
  note(`${tool.label}  ${tool.directory}`, "预览");
  const approved = await confirm({ message: "保存此 AI 工具？", initialValue: false });
  if (isCancel(approved) || !approved) return false;
  getToolDirectory(tool.directory);
  saveToolTarget(root, tool);
  tools.push(tool);
  note(`${tool.label}  ${tool.directory}`, "已添加 AI 工具");
  return true;
}

/** Validate a portable directory name and collect the frontmatter without writing files. */
async function promptForNewSkill() {
  const name = await text({
    message: "新 Skill 名称",
    placeholder: "my-skill",
    validate(value) {
      if (!value || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) || value.length > 64) {
        return "使用最多 64 个小写字母、数字和单连字符。";
      }
      if (
        /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])$/.test(value) ||
        entryAt(join(sourceRoot, value))
      ) {
        return "该目录名不可用。";
      }
    },
  });
  if (isCancel(name)) return name;

  const description = await text({
    message: "描述 Skill 的用途和适用场景",
    validate(value) {
      const trimmed = value?.trim();
      if (!trimmed) return "请输入描述。";
      if (trimmed.length > 1024) return "描述最多 1024 个字符。";
    },
  });
  if (isCancel(description)) return description;
  return { name, description: description.trim() };
}

function createSkill({ name, description }: { name: string; description: string }) {
  const directory = join(sourceRoot, name);
  mkdirSync(directory);
  const content = `---\nname: ${JSON.stringify(name)}\ndescription: ${JSON.stringify(description)}\n---\n\n# ${name}\n`;
  writeFileSync(join(directory, "SKILL.md"), content, { flag: "wx" });
}

/** Collect a skill and target selection, then preview all changes before requesting confirmation. */
async function runInteractive() {
  intro("项目 Skills");
  const tools = readToolTargets(root);
  const names = entryAt(sourceRoot)?.isDirectory()
    ? readdirSync(sourceRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && isSkillDirectory(join(sourceRoot, entry.name)))
        .map((entry) => entry.name)
        .sort()
    : [];
  let mode: "link" | "create" | "unlink" | "add-tool";
  do {
    const selected = await select<typeof mode>({
      message: "要执行哪项操作？",
      options: [
        { value: "link", label: "链接项目 Skills", disabled: names.length === 0 },
        { value: "create", label: "创建项目 Skill" },
        { value: "unlink", label: "取消链接项目 Skills" },
        { value: "add-tool", label: "添加 AI 工具" },
      ],
    });
    if (isCancel(selected)) return cancel("已取消。");
    mode = selected;
    if (mode === "add-tool" && !(await addTool(tools))) note("工具设置未保存。");
  } while (mode === "add-tool");

  if (mode === "unlink") return unlinkProjectSkills(tools);
  if (!checkDirectory(sourceRoot)) throw new Error("项目根目录缺少 skills/。");

  const newSkill = mode === "create" ? await promptForNewSkill() : undefined;
  if (isCancel(newSkill)) return cancel("已取消。");

  const namesToLink = await multiselect({
    message: newSkill ? "选择要链接的 Skills，直接按 Enter 则仅创建" : "选择要链接的 Skills",
    options: [
      ...(newSkill ? [{ value: newSkill.name, hint: "新 Skill" }] : []),
      ...names.map((name) => ({ value: name })),
    ],
    required: !newSkill,
  });
  if (isCancel(namesToLink)) return cancel("已取消。");

  const selectedTargets = namesToLink.length ? await chooseTools(tools) : [];
  if (isCancel(selectedTargets)) return cancel("已取消。");

  const plan = planLinks(selectedTargets, namesToLink);
  const conflicts = plan.filter(({ entry, action }) => entry && action !== "Already linked");
  if (conflicts.length) {
    const replacements = await multiselect({
      message: "选择要备份并替换的同名项",
      options: conflicts.map(({ destination }) => ({
        value: destination,
        label: relative(root, destination),
      })),
      required: false,
    });
    if (isCancel(replacements)) return cancel("已取消。");
    for (const conflict of conflicts) {
      conflict.action = replacements.includes(conflict.destination)
        ? "Back up and link"
        : "Keep existing";
    }
  }

  const preview = plan.map(
    ({ action, destination }) => `${actionLabels[action]}  ${relative(root, destination)}`,
  );
  if (newSkill) preview.unshift(`创建  skills/${newSkill.name}/SKILL.md`);
  note(preview.join("\n"), "预览");
  if (!newSkill && !plan.some(({ action }) => action === "Link" || action === "Back up and link")) {
    return outro("无需更改。");
  }

  const approved = await confirm({ message: "应用这些更改？", initialValue: false });
  if (isCancel(approved) || !approved) return cancel("已取消。");
  if (!checkDirectory(sourceRoot)) throw new Error("预览后 skills/ 已被移除。");
  for (const name of namesToLink) {
    if (name !== newSkill?.name && !isSkillDirectory(join(sourceRoot, name))) {
      throw new Error(`skills/${name}/SKILL.md 在预览后有变动，请重新运行。`);
    }
  }
  if (newSkill) createSkill(newSkill);
  applyLinks(plan);
  outro("更改已应用。");
}

try {
  const args = process.argv.slice(2);
  if (args.length === 1 && ["--help", "-h"].includes(args[0])) {
    console.log(
      "用法：bun scripts/link-skills.ts\n链接、创建或取消链接项目 Skill，也可以添加 AI 工具。应用前可预览更改。\n多选快捷键：a 全选或清空，i 反选。",
    );
  } else {
    if (args.length) throw new Error("用法：bun scripts/link-skills.ts");
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      throw new Error("请在交互式终端中运行 bun scripts/link-skills.ts。");
    }
    await runInteractive();
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
