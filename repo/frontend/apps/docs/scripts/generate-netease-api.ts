import { mkdir, rm, writeFile } from "node:fs/promises";

import { generateFiles } from "fumadocs-openapi";

import { NETEASE_API_TAGS } from "../lib/netease-api-schema";
import { neteaseOpenAPI } from "../lib/openapi";

const output = "./content/docs/(openapi)/netease-api/endpoints";
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

await generateFiles({
  input: neteaseOpenAPI,
  output,
  includeDescription: true,
  per: "tag",
});

await writeFile(
  `${output}/meta.json`,
  `${JSON.stringify(
    {
      title: "接口目录",
      pages: NETEASE_API_TAGS.map((tag) => tag.name),
    },
    null,
    2,
  )}\n`,
  "utf8",
);
