"use client";

export default function TitleBar() {
  return (
    <div
      className="h-12 px-4 bg-black border-b border-gray-800 flex items-center justify-between select-none"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      {/* 左侧：应用标题 */}
      <span className="text-sm text-white font-medium">Momo Music</span>
    </div>
  );
}
