import { useCallback, useRef, useState } from "react";

/**
 * 音量控制 Hook
 * @returns {Object} { volume, setVolume, handleMouseDown, handleTouchStart, isDragging }
 */
export const useVolumeControl = (initialVolume: number = 70) => {
  const [volume, setVolume] = useState(initialVolume);
  const [isDragging, setIsDragging] = useState(false);
  const volumeBarRef = useRef<HTMLDivElement>(null);

  // 根据鼠标位置计算音量
  const calculateVolume = useCallback((clientX: number) => {
    if (!volumeBarRef.current) return;

    const rect = volumeBarRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setVolume(Math.round(percent));
  }, []);

  // 鼠标按下时开始拖动
  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  // 鼠标移动时更新音量
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      calculateVolume(e.clientX);
    },
    [isDragging, calculateVolume],
  );

  // 鼠标抬起时停止拖动
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 触摸开始
  const handleTouchStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  // 触摸移动时更新音量
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging || e.touches.length === 0) return;
      calculateVolume(e.touches[0].clientX);
    },
    [isDragging, calculateVolume],
  );

  // 触摸结束
  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 点击音量条直接设置音量
  const handleBarClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      calculateVolume(e.clientX);
    },
    [calculateVolume],
  );

  // 绑定全局事件监听
  useState(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleTouchEnd);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };
    }
  });

  return {
    volume,
    setVolume,
    volumeBarRef,
    isDragging,
    handleMouseDown,
    handleTouchStart,
    handleBarClick,
  };
};
