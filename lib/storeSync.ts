import type { StoreApi, UseBoundStore } from "zustand";

export function setupStoreSync<T>(store: UseBoundStore<StoreApi<T>>, channelName: string) {
  if (typeof window === "undefined") return;

  const channel = new BroadcastChannel(channelName);
  let isUpdatingFromSync = false;

  // 1. 监听其他窗口发来的状态
  channel.onmessage = (event) => {
    isUpdatingFromSync = true;
    store.setState(event.data);
    isUpdatingFromSync = false;
  };

  // 2. 本窗口状态改变时，广播给其他窗口
  store.subscribe((state) => {
    // 避免无限循环广播
    if (!isUpdatingFromSync) {
      channel.postMessage(state);
    }
  });

  return () => channel.close();
}
