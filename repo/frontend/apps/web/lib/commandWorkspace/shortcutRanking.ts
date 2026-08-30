export function rankCommandWorkspaceEntries<T>(
  entries: readonly T[],
  getUsageCount: (entry: T) => number,
) {
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((left, right) => {
      const usageDifference = getUsageCount(right.entry) - getUsageCount(left.entry);

      return usageDifference || left.index - right.index;
    })
    .map(({ entry }) => entry);
}
