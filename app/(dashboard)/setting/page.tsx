"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

//  Spotify 风格的 Toggle 开关
const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`
        relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
        transition-colors duration-200 ease-in-out focus:outline-none
        ${enabled ? "bg-[#1ed760] hover:bg-[#1fdf64]" : "bg-[#535353] hover:bg-[#b3b3b3]"}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0
          transition duration-200 ease-in-out
          ${enabled ? "translate-x-5" : "translate-x-0"}
        `}
      />
    </button>
  );
};

// 2. 统一的配置行布局组件
const SettingRow = ({
  label,
  sublabel,
  control,
  isColumn = false,
}: {
  label: React.ReactNode;
  sublabel?: string;
  control: React.ReactNode;
  isColumn?: boolean;
}) => (
  <div className={`flex ${isColumn ? "flex-col items-start gap-3" : "justify-between items-center"} mb-6 w-full`}>
    <div className={`flex flex-col gap-1 ${!isColumn && "max-w-[75%]"}`}>
      <span className="text-white text-base font-medium">{label}</span>
      {sublabel && <span className="text-[#a7a7a7] text-sm leading-relaxed">{sublabel}</span>}
    </div>
    {control}
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


const SettingsPage = () => {
  // 模拟一些表单状态
  const [autoAdjust, setAutoAdjust] = useState(true);
  const [crossfade, setCrossfade] = useState(true);
  const [crossfadeTime, setCrossfadeTime] = useState(5);
  const [gapless, setGapless] = useState(true);
  const [normalize, setNormalize] = useState(true);
  const [showLyrics, setShowLyrics] = useState(false);
  const [hardwareAccel, setHardwareAccel] = useState(true);
  const [publicPlaylist, setPublicPlaylist] = useState(true);
  const [shareActivity, setShareActivity] = useState(false);

  // 公共的下拉框样式
  const selectClass =
    "bg-transparent border border-[#727272] text-white py-2 pl-4 pr-10 rounded text-sm font-medium cursor-pointer hover:border-white transition-colors appearance-none outline-none focus:ring-1 focus:ring-white";

  // console.log("nickname", useUserStore.getState().user?.nickname);

  return (
    <>
      < div className="w-full bg-[#121212] rounded-lg shadow-2xl p-10 md:p-14 text-[#b3b3b3] flex flex-col min-h-[80vh]" >

        {/* 顶部导航与用户信息 */}
        <div className="flex justify-between items-center mb-10 mt-4.5">
          <h1 className="text-white text-4xl md:text-5xl font-black tracking-tight">Settings</h1>
        </div >

        {/* 核心双列布局区 */}
        < div className="grow grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-10 items-start" >

          {/* 左列：音频与播放 */}
          < div className="flex flex-col gap-10" >
            {/* Audio Quality 区块 */}
            <section >
              <h3 className="text-xs font-bold text-white uppercase tracking-widest border-b border-[#282828] pb-2 mb-6">
                Audio Quality
              </h3>

              <SettingRow
                label="Streaming quality"
                control={
                  <div className="relative">
                    <select className={selectClass} defaultValue="Very High">
                      <option className="bg-[#282828]">Low</option>
                      <option className="bg-[#282828]">Normal</option>
                      <option className="bg-[#282828]">High</option>
                      <option className="bg-[#282828]">Very High</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-white absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                }
              />
              <SettingRow
                label="Auto-adjust quality"
                sublabel="Recommended. Adjusts quality based on your bandwidth."
                control={<Toggle enabled={autoAdjust} onChange={() => setAutoAdjust(!autoAdjust)} />}
              />
              <SettingRow
                label="Download quality"
                control={
                  <div className="relative">
                    <select className={selectClass} defaultValue="High">
                      <option className="bg-[#282828]">Normal</option>
                      <option className="bg-[#282828]">High</option>
                      <option className="bg-[#282828]">Very High</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-white absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                }
              />
            </section >

            {/* Playback 区块 */}
            <section  >
              <h3 className="text-xs font-bold text-white uppercase tracking-widest border-b border-[#282828] pb-2 mb-6">
                Playback
              </h3>

              {/* 包含 Slider 的特殊复合行 */}
              <div className="mb-6 w-full">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex flex-col gap-1 max-w-[75%]">
                    <span className="text-white text-base font-medium">Crossfade songs</span>
                    <span className="text-[#a7a7a7] text-sm leading-relaxed">Allows a smooth transition between tracks in a playlist.</span>
                  </div>
                  <Toggle enabled={crossfade} onChange={() => setCrossfade(!crossfade)} />
                </div>

                {/* 原生 range input 模拟 Spotify Slider */}
                <div className="flex items-center gap-4 w-full mt-4">
                  <span className="text-xs text-[#a7a7a7] w-4 text-right">0s</span>
                  <input
                    type="range"
                    min="0"
                    max="12"
                    value={crossfadeTime}
                    disabled={!crossfade}
                    onChange={(e) => setCrossfadeTime(Number(e.target.value))}
                    className={`
                      w-full h-1.5 rounded-full appearance-none outline-none cursor-pointer
                      ${crossfade ? "bg-[#535353] hover:bg-[#1ed760]" : "bg-[#282828] cursor-not-allowed"}
                    `}
                    style={{
                      // 利用 CSS 变量动态控制已填充的颜色进度
                      background: crossfade
                        ? `linear-gradient(to right, currentColor ${crossfadeTime / 12 * 100}%, #535353 ${crossfadeTime / 12 * 100}%)`
                        : "",
                      color: "#fff" // 此处 currentColor 用于响应 hover，原生实现略复杂，这里做视觉简化
                    }}
                  />
                  <span className="text-xs text-[#a7a7a7] w-6">12s</span>
                </div>
              </div>

              <SettingRow
                label="Gapless playback"
                control={<Toggle enabled={gapless} onChange={() => setGapless(!gapless)} />}
              />
              <SettingRow
                label="Normalize volume"
                sublabel="Set the same volume level for all songs."
                control={<Toggle enabled={normalize} onChange={() => setNormalize(!normalize)} />}
              />
            </section >
          </div >

          {/* 右列：显示、社交与存储 */}
          < div className="flex flex-col gap-10" >
            {/* Display 区块 */}
            <section  >
              <h3 className="text-xs font-bold text-white uppercase tracking-widest border-b border-[#282828] pb-2 mb-6">
                Display
              </h3>
              <SettingRow
                label="Show desktop lyrics"
                sublabel="Display floating lyrics on your desktop screen."
                control={<Toggle enabled={showLyrics} onChange={() => setShowLyrics(!showLyrics)} />}
              />
              <SettingRow
                label="Hardware acceleration"
                sublabel="Turn this off if the app is slow or lagging."
                control={<Toggle enabled={hardwareAccel} onChange={() => setHardwareAccel(!hardwareAccel)} />}
              />
            </section >

            {/* Social 区块 */}
            <section>
              <h3 className="text-xs font-bold text-white uppercase tracking-widest border-b border-[#282828] pb-2 mb-6">
                Social
              </h3>
              <SettingRow
                label="Make my new playlists public"
                control={<Toggle enabled={publicPlaylist} onChange={() => setPublicPlaylist(!publicPlaylist)} />}
              />
              <SettingRow
                label="Share my listening activity"
                sublabel="Let your friends see what you're playing."
                control={<Toggle enabled={shareActivity} onChange={() => setShareActivity(!shareActivity)} />}
              />
            </section >

            {/* Storage 区块 */}
            <section>
              <h3 className="text-xs font-bold text-white uppercase tracking-widest border-b border-[#282828] pb-2 mb-6">
                Storage
              </h3>
              <SettingRow
                isColumn
                label="Offline storage location"
                control={
                  <div className="w-full bg-[#282828] p-3 rounded text-[#a7a7a7] font-mono text-sm border border-transparent hover:border-[#535353] transition-colors cursor-text">
                    C:\Users\Alex\AppData\Local\MusicApp\Storage
                  </div>
                }
              />
              <SettingRow
                label="Clear cache"
                sublabel="Frees up space. Your downloads won't be removed."
                control={
                  <button className="bg-transparent border border-[#727272] text-white py-2 px-6 rounded-full text-sm font-bold tracking-wide hover:border-white hover:scale-105 transition-all active:scale-95">
                    Clear cache (3.2 GB)
                  </button>
                }
              />
            </section >
          </div >

        </div >
      </div >
    </>
  );
};

export default SettingsPage;
