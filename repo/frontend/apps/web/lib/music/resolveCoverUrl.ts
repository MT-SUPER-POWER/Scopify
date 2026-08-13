export function resolveCoverUrl(...candidates: Array<null | string | undefined>) {
  return candidates.find((candidate) => candidate?.trim()) ?? "";
}
