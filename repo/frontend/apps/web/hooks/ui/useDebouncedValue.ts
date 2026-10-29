"use client";

import { useEffect, useState } from "react";

/** 值停止变化 `delay` 毫秒后才更新，用来给输入框驱动的请求防抖。 */
export function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timeout);
  }, [delay, value]);

  return debounced;
}
