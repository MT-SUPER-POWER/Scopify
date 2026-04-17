import { useEffect, useState } from "react";

export function useHasHydrated() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  return hasHydrated;
}

// 在组件中使用示例
/**
 * const Player = () => {
  * const volume = usePlayerStore((state) => state.volume);
  * const hydrated = useHasHydrated();

  // 如果还没水合完成，返回 null 或 默认 UI，避免 SSR 报错
  * if (!hydrated) return <div>Loading...</div>;

  * return <div>Volume: { volume } </div>;
  * };
 */
