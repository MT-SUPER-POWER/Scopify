"use client";

import { useEffect, useState } from "react";

/**
 * 检测当前是否运行在 Electron 环境
 * 使用 useState 确保在客户端挂载后能正确反映 window.electronAPI 的状态，避免 水合(hydration) 导致的不一致。
 */
export const useIsElectron = (): boolean => {
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    setIsElectron(window.electronAPI !== undefined);
  }, []);

  return isElectron;
};

/**
 * 获取 Electron API（如果在 Electron 环境中）
 * 如果在 Web 环境中，返回 undefined
 */
export const useElectronAPI = () => {
  if (typeof window === "undefined") {
    return undefined;
  }
  return window.electronAPI;
};

/**
 * 监听全屏状态变化（支持 Electron 和 Web 环境）
 * @param callback 全屏状态改变时的回调函数 (isFullScreen: boolean) => void
 */
export const useFullScreenListener = (callback: (isFullScreen: boolean) => void) => {
  const isElectron = useIsElectron();

  useEffect(() => {
    if (isElectron) {
      // Electron 环境：使用 Electron API 的全屏监听
      if (window.electronAPI?.onFullScreenChanged) {
        window.electronAPI.onFullScreenChanged((isFullScreen: boolean) => callback(isFullScreen));
      }
    }
    else {
      // Web 环境：监听浏览器的 fullscreenchange 事件
      const handleFullScreenChange = () => {
        const isFullScreen = !!document.fullscreenElement;
        callback(isFullScreen);
      };

      document.addEventListener("fullscreenchange", handleFullScreenChange);

      // 清理事件监听
      return () => {
        document.removeEventListener("fullscreenchange", handleFullScreenChange);
      };
    }
  }, [isElectron, callback]);
};
