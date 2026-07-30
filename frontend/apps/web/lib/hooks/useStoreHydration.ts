import { useEffect, useState } from "react";
import { usePlayerStore } from "@/store/module/player";
import { useTimeStore } from "@/store/module/time";
import { useUserStore } from "@/store/module/user";

/**
 * 等待所有关键 Zustand persist store 完成水合。
 *
 * SSR 首帧时 persist 还未从 localStorage 恢复，所有 store 都是默认值
 * （user=null, currentTime=0, …）。如果直接渲染，会先闪一帧「未登录」UI，
 * 然后再切到「已登录」UI，造成视觉闪烁和水合不匹配。
 *
 * 此 hook 返回 `true` 表示已水合完成，可以安全渲染。
 */
export function useStoreHydration(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // persist store 在 create() 时即发起水合（从 localStorage 读取），
    // 但时序可能在组件 mount 前或后完成。
    // persist API 提供 onFinishHydration 回调来监听水合结束。
    const stores = [useUserStore.persist, usePlayerStore.persist, useTimeStore.persist];

    // 先检查是否所有 store 都已经水合完成（大多数情况下是同步完成的）
    const allReady = stores.every((persist) => persist.hasHydrated());

    if (allReady) {
      setHydrated(true);
      return;
    }

    // 否则，监听每个 store 的水合完成事件
    let remaining = stores.length;
    const unsubs: (() => void)[] = [];

    const onHydrated = () => {
      remaining -= 1;
      if (remaining <= 0) {
        setHydrated(true);
      }
    };

    for (const store of stores) {
      if (store.hasHydrated()) {
        // 已经水合过了，直接减一
        onHydrated();
      } else unsubs.push(store.onFinishHydration(onHydrated));
    }

    return () => {
      for (const unsub of unsubs) unsub();
    };
  }, []);

  return hydrated;
}
