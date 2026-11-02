/** 命令面板里可被搜索的一条记录；字段按权重从高到低：label > keywords > path > summary。 */
export interface CommandSearchDocument {
  id: string;
  label: string;
  keywords?: string;
  path?: string;
  summary?: string;
}

/** 半开区间 [start, end) 的字符下标，用于高亮 label 中命中的部分。 */
export type CommandSearchRange = readonly [start: number, end: number];

export interface CommandSearchHit<T> {
  item: T;
  score: number;
  labelRanges: CommandSearchRange[];
}

export interface CommandUsageEntry {
  count: number;
  lastUsedAt: number;
}

export type CommandUsageRecord = Record<string, CommandUsageEntry>;
