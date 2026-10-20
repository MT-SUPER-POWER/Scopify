/** 把秒数格式化成播放器里的 `mm:ss`。 */
export const formatSongTime = (seconds: number) => {
  const total = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

/** 平滑滚动到页面上的某个位置，减少动态效果时直接跳转。 */
export const scrollPageTo = (top: number, reducedMotion: boolean) => {
  window.scrollTo({ top, behavior: reducedMotion ? "instant" : "smooth" });
};
