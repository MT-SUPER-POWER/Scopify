"use client";

export default function TitleBar() {
  const minimize = () => {
    window.electronAPI?.minimize();
  };

  const maximize = () => {
    window.electronAPI?.maximize();
  };

  const close = () => {
    window.electronAPI?.close();
  };

  return (
    <div
      className="h-12 px-4 bg-black border-b border-gray-800 flex items-center justify-between select-none"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      {/* 左侧：应用标题 */}
      <span className="text-sm text-white font-medium">Momo Music</span>

      {/* 右侧：控制按钮 */}
      <div
        className="flex items-center gap-3"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <button
          onClick={minimize}
          className="text-gray-400 hover:text-white transition-colors"
          title="最小化"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="5" y="10" width="14" height="2" />
          </svg>
        </button>

        <button
          onClick={maximize}
          className="text-gray-400 hover:text-white transition-colors"
          title="最大化"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="4" width="16" height="16" />
          </svg>
        </button>

        <button
          onClick={close}
          className="text-gray-400 hover:text-white transition-colors"
          title="关闭"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.4L17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
