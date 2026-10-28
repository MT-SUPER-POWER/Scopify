import type { UpdateGroupDefinition } from "@/types/updates/model";

// Order and headings mirror the commit_parsers groups in cliff.toml.
export const UPDATE_GROUPS: readonly UpdateGroupDefinition[] = [
  { id: "added", heading: "新增" },
  { id: "fixed", heading: "修复" },
  { id: "improved", heading: "优化" },
];
