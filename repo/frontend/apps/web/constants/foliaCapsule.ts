export const FOLIA_CAPSULE_QUICK_ACTIONS = [
  "shuffle",
  "like",
  "playlist",
  "volume",
  "visualizers",
  "subtitles",
] as const;

export const FOLIA_CAPSULE_ACTIONS = [
  "repeat",
  "timeline",
  ...FOLIA_CAPSULE_QUICK_ACTIONS,
] as const;
