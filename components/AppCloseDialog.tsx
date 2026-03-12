'use client';

import { useEffect, useState, useCallback } from "react";

export default function AppCloseDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.electronAPI) return;

    // 监听主进程发送的关闭确认信号
    const handleCloseConfirm = () => {
      const savedAction = localStorage.getItem("app-close-action");
      if (savedAction === "minimize" || savedAction === "exit") {
        window.electronAPI?.sendAppCloseAction(savedAction);
        return;
      }
      setIsOpen(true);
    };

    // NOTE: electronAPI.on 建议在 preload 中支持移除监听，或者这里确保只绑定一次
    window.electronAPI.on("app-close-confirm", handleCloseConfirm);
  }, []);

  const handleAction = useCallback((action: "minimize" | "exit") => {
    if (remember) {
      localStorage.setItem("app-close-action", action);
    }
    window.electronAPI?.sendAppCloseAction(action);
    setIsOpen(false);
  }, [remember]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => setIsOpen(false)}>
      <div
        // Spotify 经典模态框：深灰底色、圆角、无明显边框
        className="bg-[#282828] w-100 rounded-xl shadow-2xl p-8 flex flex-col items-center text-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-2 mb-8">
          <h2 className="text-2xl font-bold text-white tracking-tight">关闭 Scopify</h2>
          {/* Spotify 标准辅助灰色 #b3b3b3 */}
          <p className="text-[#b3b3b3] text-sm">
            您希望关闭应用后的默认行为是？
          </p>
        </div>

        {/* 放弃双列网格，改为 Spotify 标志性的垂直胶囊按钮排列 */}
        <div className="flex flex-col gap-4 w-full">
          <button
            onClick={() => handleAction("minimize")}
            // 品牌绿底黑字，配合轻微的 hover 放大动效
            className="flex flex-col items-center justify-center w-full py-3.5 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] hover:scale-105 transition-all active:scale-100"
          >
            <span className="text-black font-bold text-base">最小化到托盘</span>
          </button>
          <button
            onClick={() => handleAction("exit")}
            // 次要按钮：透明底色，灰色描边，hover 时边框变白
            className="flex flex-col items-center justify-center w-full py-3.5 rounded-full bg-transparent border border-[#727272] hover:border-white hover:scale-105 transition-all active:scale-100"
          >
            <span className="text-white font-bold text-base">退出程序</span>
          </button>
        </div>

        <div className="flex items-center gap-3 mt-8 mb-2 cursor-pointer select-none group" onClick={() => setRemember(!remember)}>
          <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-colors ${remember ? 'bg-[#1ed760] border-[#1ed760]' : 'border-[#727272] group-hover:border-white'}`}>
            {remember && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            )}
          </div>
          <span className="text-[#b3b3b3] group-hover:text-white text-sm transition-colors">下次不再提示</span>
        </div>
      </div>
    </div>
  );
}
