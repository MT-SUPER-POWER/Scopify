import type {
  TracklistColumnId,
  TracklistColumnPair,
  TracklistColumnVisibility,
  TracklistColumnWidths,
  TracklistResizableColumnId,
} from "@/types/tracklist";

export const TRACKLIST_INDEX_COLUMN_WIDTH = 56;

const FULL_LAYOUT_COLUMNS: TracklistColumnId[] = [
  "index",
  "title",
  "album",
  "date",
  "like",
  "duration",
];
const MEDIUM_LAYOUT_COLUMNS: TracklistColumnId[] = ["index", "title", "album", "duration"];
const COMPACT_LAYOUT_COLUMNS: TracklistColumnId[] = ["index", "title", "duration"];

const TRACKLIST_COLUMN_MINIMUMS: Record<TracklistColumnId, number> = {
  album: 120,
  date: 104,
  duration: 72,
  index: TRACKLIST_INDEX_COLUMN_WIDTH,
  like: 48,
  title: 200,
};

const FULL_LAYOUT_WEIGHTS: Record<TracklistResizableColumnId, number> = {
  album: 0.3,
  date: 0.15,
  duration: 0.08,
  like: 0.07,
  title: 0.4,
};

const MEDIUM_LAYOUT_WEIGHTS: Record<TracklistResizableColumnId, number> = {
  album: 0.3,
  date: 0,
  duration: 0.1,
  like: 0,
  title: 0.6,
};

const COMPACT_LAYOUT_WEIGHTS: Record<TracklistResizableColumnId, number> = {
  album: 0,
  date: 0,
  duration: 0.14,
  like: 0,
  title: 0.86,
};

function columnsMatch(left: TracklistColumnId[], right: TracklistColumnId[]) {
  return left.length === right.length && left.every((column, index) => column === right[index]);
}

function createEmptyWidths(): TracklistColumnWidths {
  return { album: 0, date: 0, duration: 0, index: TRACKLIST_INDEX_COLUMN_WIDTH, like: 0, title: 0 };
}

function distributeWidth(
  columns: TracklistResizableColumnId[],
  totalWidth: number,
  weights: Record<TracklistResizableColumnId, number>,
) {
  const widths = createEmptyWidths();
  const unconstrainedColumns = new Set(columns);
  let remainingWidth = totalWidth;
  let remainingWeight = columns.reduce((total, column) => total + weights[column], 0);

  if (remainingWeight === 0) {
    remainingWeight = columns.length;
    for (const column of columns) weights[column] = 1;
  }

  while (unconstrainedColumns.size > 0) {
    const constrainedColumn = [...unconstrainedColumns].find(
      (column) =>
        (remainingWidth * weights[column]) / remainingWeight < TRACKLIST_COLUMN_MINIMUMS[column],
    );

    if (!constrainedColumn) {
      const columnsToDistribute = [...unconstrainedColumns];
      let allocatedWidth = 0;

      for (const column of columnsToDistribute.slice(0, -1)) {
        widths[column] = Math.round((remainingWidth * weights[column]) / remainingWeight);
        allocatedWidth += widths[column];
      }

      const finalColumn = columnsToDistribute.at(-1);
      if (finalColumn) {
        widths[finalColumn] = remainingWidth - allocatedWidth;
      }
      break;
    }

    widths[constrainedColumn] = TRACKLIST_COLUMN_MINIMUMS[constrainedColumn];
    remainingWidth -= widths[constrainedColumn];
    remainingWeight -= weights[constrainedColumn];
    unconstrainedColumns.delete(constrainedColumn);
  }

  return widths;
}

function getResizableColumns(columns: TracklistColumnId[]) {
  return columns.filter((column): column is TracklistResizableColumnId => column !== "index");
}

function getTotalLayoutWidth(containerWidth: number, columns: TracklistColumnId[]) {
  return Math.max(containerWidth, getTracklistMinimumTableWidth(columns));
}

function toWidthWeights(widths: TracklistColumnWidths, columns: TracklistResizableColumnId[]) {
  const total = columns.reduce((sum, column) => sum + widths[column], 0);
  const result = { ...FULL_LAYOUT_WEIGHTS };

  for (const column of Object.keys(result) as TracklistResizableColumnId[]) {
    result[column] = columns.includes(column) ? widths[column] / total : 0;
  }

  return result;
}

export function getTracklistVisibleColumns({
  showAlbumColumn,
  showDateColumn,
  showLikeColumn,
}: TracklistColumnVisibility): TracklistColumnId[] {
  return [
    "index",
    "title",
    ...(showAlbumColumn ? (["album"] as const) : []),
    ...(showDateColumn ? (["date"] as const) : []),
    ...(showLikeColumn ? (["like"] as const) : []),
    "duration",
  ];
}

export function getTracklistColumnMinimumWidth(column: TracklistColumnId) {
  return TRACKLIST_COLUMN_MINIMUMS[column];
}

export function getTracklistMinimumTableWidth(columns: TracklistColumnId[]) {
  return columns.reduce((total, column) => total + TRACKLIST_COLUMN_MINIMUMS[column], 0);
}

export function getTracklistDefaultColumnWeights(columns: TracklistColumnId[]) {
  if (columnsMatch(columns, FULL_LAYOUT_COLUMNS)) return { ...FULL_LAYOUT_WEIGHTS };
  if (columnsMatch(columns, MEDIUM_LAYOUT_COLUMNS)) return { ...MEDIUM_LAYOUT_WEIGHTS };
  if (columnsMatch(columns, COMPACT_LAYOUT_COLUMNS)) return { ...COMPACT_LAYOUT_WEIGHTS };

  const visibleColumns = getResizableColumns(columns);
  const visibleWeightTotal = visibleColumns.reduce(
    (total, column) => total + FULL_LAYOUT_WEIGHTS[column],
    0,
  );
  const weights = { ...FULL_LAYOUT_WEIGHTS };

  for (const column of Object.keys(weights) as TracklistResizableColumnId[]) {
    weights[column] = visibleColumns.includes(column)
      ? FULL_LAYOUT_WEIGHTS[column] / visibleWeightTotal
      : 0;
  }

  return weights;
}

export function getDefaultTracklistColumnWidths(
  containerWidth: number,
  columns: TracklistColumnId[],
): TracklistColumnWidths {
  const totalWidth = getTotalLayoutWidth(containerWidth, columns);
  const widths = distributeWidth(
    getResizableColumns(columns),
    totalWidth - TRACKLIST_INDEX_COLUMN_WIDTH,
    getTracklistDefaultColumnWeights(columns),
  );

  widths.index = TRACKLIST_INDEX_COLUMN_WIDTH;
  return widths;
}

export function getTracklistResizePairs(columns: TracklistColumnId[]): TracklistColumnPair[] {
  return columns.slice(1, -1).map((left, index) => ({
    left,
    right: columns[index + 2] as TracklistResizableColumnId,
  })) as TracklistColumnPair[];
}

export function fitTracklistColumnWidths(
  widths: TracklistColumnWidths,
  containerWidth: number,
  columns: TracklistColumnId[],
): TracklistColumnWidths {
  const resizableColumns = getResizableColumns(columns);
  const totalWidth = getTotalLayoutWidth(containerWidth, columns);
  const nextWidths = distributeWidth(
    resizableColumns,
    totalWidth - TRACKLIST_INDEX_COLUMN_WIDTH,
    toWidthWeights(widths, resizableColumns),
  );

  nextWidths.index = TRACKLIST_INDEX_COLUMN_WIDTH;
  return nextWidths;
}

export function resizeTracklistColumnPair(
  widths: TracklistColumnWidths,
  pair: TracklistColumnPair,
  delta: number,
): TracklistColumnWidths {
  const pairWidth = widths[pair.left] + widths[pair.right];
  const minimumLeftWidth = getTracklistColumnMinimumWidth(pair.left);
  const maximumLeftWidth = pairWidth - getTracklistColumnMinimumWidth(pair.right);
  const nextLeftWidth = Math.min(
    maximumLeftWidth,
    Math.max(minimumLeftWidth, widths[pair.left] + delta),
  );

  return {
    ...widths,
    [pair.left]: nextLeftWidth,
    [pair.right]: pairWidth - nextLeftWidth,
  };
}

export function resetTracklistColumnPair(
  widths: TracklistColumnWidths,
  pair: TracklistColumnPair,
  columns: TracklistColumnId[],
): TracklistColumnWidths {
  const pairWidth = widths[pair.left] + widths[pair.right];
  const defaultWeights = getTracklistDefaultColumnWeights(columns);
  const resetWidths = distributeWidth([pair.left, pair.right], pairWidth, defaultWeights);

  return {
    ...widths,
    [pair.left]: resetWidths[pair.left],
    [pair.right]: resetWidths[pair.right],
  };
}
