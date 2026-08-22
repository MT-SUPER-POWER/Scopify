import fs from "node:fs";
import path from "node:path";

const appRoot = path.resolve(import.meta.dirname, "..");
const contentRoot = path.join(appRoot, "content/docs/(ui-library)/shadcn");
const referenceRoot = path.join(appRoot, "docs/references/shadcn-ui-upstream/apps/v4");
const officialDocsRoot = path.join(referenceRoot, "content/docs/components/radix");
const officialExamplesRoot = path.join(referenceRoot, "examples/radix");
const componentRoot = path.resolve(appRoot, "../../packages/ui/shadcn/components");
const generatedExamplesFile = path.join(appRoot, "components/docs/shadcn-official-examples.json");
const generatedSourcesFile = path.join(appRoot, "components/docs/shadcn-component-sources.json");

function findFiles(root, extension) {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(root, entry.name);
    return entry.isDirectory()
      ? findFiles(entryPath, extension)
      : entryPath.endsWith(extension)
        ? [entryPath]
        : [];
  });
}

function getFrontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  return Object.fromEntries(
    [...match[1].matchAll(/^(title|description):\s*(.+)$/gm)].map((item) => [
      item[1],
      item[2].trim(),
    ]),
  );
}

function escapeYaml(value) {
  return value.replaceAll('"', '\\"');
}

function transformImports(body) {
  return body
    .replaceAll("@/components/ui/", "@scopify/ui/shadcn/components/")
    .replaceAll("@/registry/new-york-v4/ui/", "@scopify/ui/shadcn/components/")
    .replaceAll("@/styles/radix-nova/ui/", "@scopify/ui/shadcn/components/")
    .replaceAll("@/lib/utils", "@scopify/ui/shadcn/lib/utils")
    .replaceAll("/docs/components/radix/", "/docs/ui-library/shadcn/")
    .replaceAll("@tabler/icons-react", "lucide-react")
    .replaceAll("IconInfoCircle", "InfoIcon");
}

function transformComponentPreviews(body) {
  return body.replace(/<ComponentPreview\b([\s\S]*?)\/>/g, (_match, attributes) => {
    if (!attributes.match(/\bname="([^"]+)"/)) return "";
    return `<ShadcnOfficialPreview${attributes} />`;
  });
}

function transformComponentSources(body) {
  return body.replace(/<ComponentSource\b([\s\S]*?)\/>/g, (_match, attributes) => {
    return `<ShadcnComponentSource${attributes} />`;
  });
}

function syncReferenceSources() {
  const examples = Object.fromEntries(
    findFiles(officialExamplesRoot, ".tsx").map((file) => [
      path.basename(file, ".tsx"),
      transformImports(fs.readFileSync(file, "utf8")),
    ]),
  );
  const sources = Object.fromEntries(
    findFiles(componentRoot, ".tsx").map((file) => [
      path.basename(file, ".tsx"),
      fs.readFileSync(file, "utf8"),
    ]),
  );
  fs.writeFileSync(generatedExamplesFile, `${JSON.stringify(examples, null, 2)}\n`, "utf8");
  fs.writeFileSync(generatedSourcesFile, `${JSON.stringify(sources, null, 2)}\n`, "utf8");
  return { exampleCount: Object.keys(examples).length, sourceCount: Object.keys(sources).length };
}

function addScopifyNote(body) {
  const note = `<Callout title="Scopify 说明">本页按 shadcn/ui 官方 Radix UI 组件文档的章节与示例完整整理。示例预览使用 Scopify 当前的 @scopify/ui/shadcn 实现；导入路径、主题 Token 和行为差异以本仓库源码为准。</Callout>`;
  const marker = "## Installation";
  return body.includes(marker)
    ? body.replace(marker, `${note}\n\n${marker}`)
    : `${note}\n\n${body}`;
}

const localPages = findFiles(contentRoot, ".mdx").filter((file) => {
  const slug = path.basename(file, ".mdx");
  return slug !== "index" && slug !== "theme";
});
const officialPages = new Map(
  findFiles(officialDocsRoot, ".mdx").map((file) => [path.basename(file, ".mdx"), file]),
);

const { exampleCount, sourceCount } = syncReferenceSources();
let synced = 0;
const skipped = [];

for (const file of localPages) {
  const slug = path.basename(file, ".mdx");
  const officialFile = officialPages.get(slug);
  if (!officialFile || slug === "button") {
    if (!officialFile) skipped.push(slug);
    continue;
  }

  const current = fs.readFileSync(file, "utf8");
  const localFrontmatter = getFrontmatter(current);
  const official = fs.readFileSync(officialFile, "utf8");
  const officialBody = official.replace(/^---\r?\n[\s\S]*?\r?\n---\s*/, "");
  const body = addScopifyNote(
    transformImports(transformComponentSources(transformComponentPreviews(officialBody))),
  );
  const frontmatter = `---\ntitle: "${escapeYaml(localFrontmatter.title ?? slug)}"\ndescription: "${escapeYaml(localFrontmatter.description ?? "")}"\n---`;
  fs.writeFileSync(file, `${frontmatter}\n\n${body.trim()}\n`, "utf8");
  synced += 1;
}

console.log(
  `Synced ${synced} component docs from upstream (${exampleCount} example sources, ${sourceCount} local sources).`,
);
if (skipped.length > 0) console.log(`Skipped without upstream pages: ${skipped.join(", ")}`);
