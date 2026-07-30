export function defineMessages<const T extends Record<string, string>>(
  zhCN: T,
  zhTW: Record<keyof T, string>,
  enUS: Record<keyof T, string>,
) {
  return {
    "zh-CN": zhCN,
    "zh-TW": zhTW,
    "en-US": enUS,
  } as const;
}
