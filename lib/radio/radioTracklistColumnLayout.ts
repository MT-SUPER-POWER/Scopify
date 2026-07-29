import type {
  RadioTracklistColumnId,
  RadioTracklistColumnPair,
  RadioTracklistColumnVisibility,
  RadioTracklistColumnWidths,
  RadioTracklistResizableColumnId,
} from "@/types/radio";

export const RADIO_TRACKLIST_INDEX_COLUMN_WIDTH = 56;

const FULL_LAYOUT_COLUMNS: RadioTracklistColumnId[] = [
  "index",
  "title",
  "progress",
  "updatedAt",
  "playCount",
  "duration",
];
const COMPACT_LAYOUT_COLUMNS: RadioTracklistColumnId[] = ["index", "title", "progress", "duration"];

const RADIO_TRACKLIST_COLUMN_MINIMUMS: Record<RadioTracklistColumnId, number> = {
  duration: 72,
  index: RADIO_TRACKLIST_INDEX_COLUMN_WIDTH,
  playCount: 80,
  progress: 80,
  title: 220,
  updatedAt: 104,
};

const FULL_LAYOUT_WEIGHTS: Record<RadioTracklistResizableColumnId, number> = {
  duration: 0.12,
  playCount: 0.14,
  progress: 0.12,
  title: 0.46,
  updatedAt: 0.16,
};

const COMPACT_LAYOUT_WEIGHTS: Record<RadioTracklistResizableColumnId, number> = {
  duration: 0.14,
  playCount: 0,
  progress: 0.16,
  title: 0.7,
  updatedAt: 0,
};

function columnsMatch(left: RadioTracklistColumnId[], right: RadioTracklistColumnId[]) {
  return left.length === right.length && left.every((column, index) => column === right[index]);
}

function createEmptyWidths(): RadioTracklistColumnWidths {
  return {
    duration: 0,
    index: RADIO_TRACKLIST_INDEX_COLUMN_WIDTH,
    playCount: 0,
    progress: 0,
    title: 0,
    updatedAt: 0,
  };
}

function getResizableColumns(columns: RadioTracklistColumnId[]) {
  return columns.filter((column): column is RadioTracklistResizableColumnId => column !== "index");
}

function isMinimumWidthLayout(
  widths: RadioTracklistColumnWidths,
  columns: RadioTracklistResizableColumnId[],
) {
  return columns.every((column) => widths[column] === RADIO_TRACKLIST_COLUMN_MINIMUMS[column]);
}

function distributeWidth(
  columns: RadioTracklistResizableColumnId[],
  totalWidth: number,
  weights: Record<RadioTracklistResizableColumnId, number>,
) {
  const widths = createEmptyWidths();
  const unconstrainedColumns = new Set(columns);
  const normalizedWeights = { ...weights };
  let remainingWidth = totalWidth;
  let remainingWeight = columns.reduce((total, column) => total + normalizedWeights[column], 0);

  if (remainingWeight === 0) {
    remainingWeight = columns.length;
    for (const column of columns) normalizedWeights[column] = 1;
  }

  while (unconstrainedColumns.size > 0) {
    const constrainedColumn = [...unconstrainedColumns].find(
      (column) =>
        (remainingWidth * normalizedWeights[column]) / remainingWeight <
        RADIO_TRACKLIST_COLUMN_MINIMUMS[column],
    );

    if (!constrainedColumn) {
      const columnsToDistribute = [...unconstrainedColumns];
      let allocatedWidth = 0;

      for (const column of columnsToDistribute.slice(0, -1)) {
        widths[column] = Math.round((remainingWidth * normalizedWeights[column]) / remainingWeight);
        allocatedWidth += widths[column];
      }

      const finalColumn = columnsToDistribute.at(-1);
      if (finalColumn) widths[finalColumn] = remainingWidth - allocatedWidth;
      break;
    }

    widths[constrainedColumn] = RADIO_TRACKLIST_COLUMN_MINIMUMS[constrainedColumn];
    remainingWidth -= widths[constrainedColumn];
    remainingWeight -= normalizedWeights[constrainedColumn];
    unconstrainedColumns.delete(constrainedColumn);
  }

  return widths;
}

function getTotalLayoutWidth(containerWidth: number, columns: RadioTracklistColumnId[]) {
  return Math.max(containerWidth, getRadioTracklistMinimumTableWidth(columns));
}

function toWidthWeights(
  widths: RadioTracklistColumnWidths,
  columns: RadioTracklistResizableColumnId[],
) {
  const total = columns.reduce((sum, column) => sum + widths[column], 0);
  const result = { ...FULL_LAYOUT_WEIGHTS };

  for (const column of Object.keys(result) as RadioTracklistResizableColumnId[]) {
    result[column] = columns.includes(column) && total > 0 ? widths[column] / total : 0;
  }

  return result;
}

export function getRadioTracklistVisibleColumns({
  showPlayCountColumn,
  showUpdatedAtColumn,
}: RadioTracklistColumnVisibility): RadioTracklistColumnId[] {
  return [
    "index",
    "title",
    "progress",
    ...(showUpdatedAtColumn ? (["updatedAt"] as const) : []),
    ...(showPlayCountColumn ? (["playCount"] as const) : []),
    "duration",
  ];
}

export function getRadioTracklistColumnMinimumWidth(column: RadioTracklistColumnId) {
  return RADIO_TRACKLIST_COLUMN_MINIMUMS[column];
}

export function getRadioTracklistMinimumTableWidth(columns: RadioTracklistColumnId[]) {
  return columns.reduce((total, column) => total + RADIO_TRACKLIST_COLUMN_MINIMUMS[column], 0);
}

export function getRadioTracklistDefaultColumnWeights(columns: RadioTracklistColumnId[]) {
  if (columnsMatch(columns, FULL_LAYOUT_COLUMNS)) return { ...FULL_LAYOUT_WEIGHTS };
  if (columnsMatch(columns, COMPACT_LAYOUT_COLUMNS)) return { ...COMPACT_LAYOUT_WEIGHTS };

  const visibleColumns = getResizableColumns(columns);
  const visibleWeightTotal = visibleColumns.reduce(
    (total, column) => total + FULL_LAYOUT_WEIGHTS[column],
    0,
  );
  const weights = { ...FULL_LAYOUT_WEIGHTS };

  for (const column of Object.keys(weights) as RadioTracklistResizableColumnId[]) {
    weights[column] = visibleColumns.includes(column)
      ? FULL_LAYOUT_WEIGHTS[column] / visibleWeightTotal
      : 0;
  }

  return weights;
}

export function getDefaultRadioTracklistColumnWidths(
  containerWidth: number,
  columns: RadioTracklistColumnId[],
): RadioTracklistColumnWidths {
  const totalWidth = getTotalLayoutWidth(containerWidth, columns);
  const widths = distributeWidth(
    getResizableColumns(columns),
    totalWidth - RADIO_TRACKLIST_INDEX_COLUMN_WIDTH,
    getRadioTracklistDefaultColumnWeights(columns),
  );

  widths.index = RADIO_TRACKLIST_INDEX_COLUMN_WIDTH;
  return widths;
}

export function getRadioTracklistResizePairs(columns: RadioTracklistColumnId[]) {
  return columns.slice(1, -1).map((left, index) => ({
    left,
    right: columns[index + 2],
  })) as RadioTracklistColumnPair[];
}

export function fitRadioTracklistColumnWidths(
  widths: RadioTracklistColumnWidths,
  containerWidth: number,
  columns: RadioTracklistColumnId[],
): RadioTracklistColumnWidths {
  const resizableColumns = getResizableColumns(columns);
  if (isMinimumWidthLayout(widths, resizableColumns)) {
    return getDefaultRadioTracklistColumnWidths(containerWidth, columns);
  }

  const totalWidth = getTotalLayoutWidth(containerWidth, columns);
  const nextWidths = distributeWidth(
    resizableColumns,
    totalWidth - RADIO_TRACKLIST_INDEX_COLUMN_WIDTH,
    toWidthWeights(widths, resizableColumns),
  );

  nextWidths.index = RADIO_TRACKLIST_INDEX_COLUMN_WIDTH;
  return nextWidths;
}

export function resizeRadioTracklistColumnPair(
  widths: RadioTracklistColumnWidths,
  pair: RadioTracklistColumnPair,
  delta: number,
): RadioTracklistColumnWidths {
  const pairWidth = widths[pair.left] + widths[pair.right];
  const minimumLeftWidth = getRadioTracklistColumnMinimumWidth(pair.left);
  const maximumLeftWidth = pairWidth - getRadioTracklistColumnMinimumWidth(pair.right);
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

export function resetRadioTracklistColumnPair(
  widths: RadioTracklistColumnWidths,
  pair: RadioTracklistColumnPair,
  columns: RadioTracklistColumnId[],
): RadioTracklistColumnWidths {
  const pairWidth = widths[pair.left] + widths[pair.right];
  const defaultWeights = getRadioTracklistDefaultColumnWeights(columns);
  const resetWidths = distributeWidth([pair.left, pair.right], pairWidth, defaultWeights);

  return {
    ...widths,
    [pair.left]: resetWidths[pair.left],
    [pair.right]: resetWidths[pair.right],
  };
}
