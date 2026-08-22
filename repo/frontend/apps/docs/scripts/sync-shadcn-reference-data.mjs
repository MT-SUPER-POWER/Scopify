import fs from "node:fs";
import path from "node:path";

const appRoot = path.resolve(import.meta.dirname, "..");
const referenceRoot = path.join(appRoot, "docs/references/shadcn-ui-upstream/apps/v4");
const examplesRoot = path.join(referenceRoot, "examples/radix");
const componentsRoot = path.resolve(appRoot, "../../packages/ui/shadcn/components");
const outputRoot = path.join(appRoot, "components/docs");

function findFiles(root, extension) {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(root, entry.name);
    return entry.isDirectory()
      ? findFiles(file, extension)
      : file.endsWith(extension)
        ? [file]
        : [];
  });
}

function transformImports(source) {
  return source
    .replaceAll("@/components/ui/", "@scopify/ui/shadcn/components/")
    .replaceAll("@/registry/new-york-v4/ui/", "@scopify/ui/shadcn/components/")
    .replaceAll("@/styles/radix-nova/ui/", "@scopify/ui/shadcn/components/")
    .replaceAll("@/lib/utils", "@scopify/ui/shadcn/lib/utils")
    .replaceAll("@tabler/icons-react", "lucide-react")
    .replaceAll("IconInfoCircle", "InfoIcon");
}

const examples = Object.fromEntries(
  findFiles(examplesRoot, ".tsx").map((file) => [
    path.basename(file, ".tsx"),
    transformImports(fs.readFileSync(file, "utf8")),
  ]),
);
const sources = Object.fromEntries(
  findFiles(componentsRoot, ".tsx").map((file) => [
    path.basename(file, ".tsx"),
    fs.readFileSync(file, "utf8"),
  ]),
);

fs.writeFileSync(
  path.join(outputRoot, "shadcn-official-examples.json"),
  `${JSON.stringify(examples, null, 2)}\n`,
  "utf8",
);
fs.writeFileSync(
  path.join(outputRoot, "shadcn-component-sources.json"),
  `${JSON.stringify(sources, null, 2)}\n`,
  "utf8",
);
console.log(
  `Wrote ${Object.keys(examples).length} upstream examples and ${Object.keys(sources).length} local component sources.`,
);
