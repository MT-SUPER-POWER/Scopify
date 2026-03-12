"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { AppConfig } from "@/types/config";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { isElectronEnv } from "@/lib/utils";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ COMPONENTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Spotify 风格的 Toggle 开关
const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => {
  const router = useSmartRouter();
  const isElectron = isElectronEnv();


  useEffect(() => {
    if (isElectron) {
      router.replace("/");
    }
  }, [isElectron]);


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

// 简单的输入框组件
const SettingInput = ({ value, onChange, type = "text" }: { value: string | number, onChange: (v: string) => void, type?: string }) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="bg-transparent border border-[#727272] text-white py-1.5 px-3 rounded text-sm font-medium outline-none focus:border-white transition-colors w-28 text-right focus:ring-1 focus:ring-white"
  />
);

// 统一的配置行布局组件
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
  const isElectron = isElectronEnv();
  const router = useSmartRouter();

  useEffect(() => {
    if (!isElectron) {
      router.replace("/");
    }
  }, [isElectron]);

  // 核心配置状态
  const [config, setConfig] = useState<AppConfig | null>(null);

  // 公共的下拉框样式
  const selectClass =
    "bg-transparent border border-[#727272] text-white py-2 pl-4 pr-10 rounded text-sm font-medium cursor-pointer hover:border-white transition-colors appearance-none outline-none focus:ring-1 focus:ring-white";

  // 1. 初始化加载配置
  // TODO: 前端和配置文件做交互的地方
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.electronAPI) {
        console.log("[Settings] 正在从主进程请求初始配置...");
        window.electronAPI.getAppConfig().then((cfg: AppConfig) => {
          console.log("[Settings] 初始配置加载成功:", cfg);
          setConfig(cfg);
        }).catch(err => {
          console.error("[Settings] 加载主进程配置失败，回退到 Web 默认配置:", err);
        });
      } else {
        console.log("[Settings] 非 Electron 环境，加载 Web 注入的配置...");
      }
    }
  }, []);

  // 2. 统一更新处理器
  const handleUpdateConfig = async <S extends keyof AppConfig, K extends keyof AppConfig[S]>(
    section: S,
    key: K,
    value: AppConfig[S][K]
  ) => {
    if (!config || typeof window === "undefined" || !window.electronAPI) return;

    console.log(`[Settings] 触发修改 -> [${section}.${String(key)}]:`, value);

    // 乐观更新 UI 状态
    const newConfig = {
      ...config,
      [section]: {
        ...config[section],
        [key]: value
      }
    };
    setConfig(newConfig);

    // 构造 payload 发送给 Electron IPC
    const updatePayload = {
      [section]: {
        [key]: value
      }
    };

    try {
      const updatedConfig = await window.electronAPI.updateAppConfig(updatePayload);
      console.log("[Settings] 主进程 TOML 写入成功，返回最新配置:", updatedConfig);
    } catch (error) {
      console.error("[Settings] TOML 配置写入失败:", error);
    }
  };

  // 如果配置还没加载出来，显示骨架或直接 null（可以根据需要换成 Loading 组件）
  if (!config) {
    return (
      <div className="w-full bg-[#121212] rounded-lg shadow-2xl p-10 md:p-14 text-[#b3b3b3] flex flex-col min-h-[80vh] items-center justify-center">
        <span className="text-white animate-pulse">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#121212] rounded-lg shadow-2xl p-10 md:p-14 text-[#b3b3b3] flex flex-col min-h-[80vh]">

      {/* 顶部导航 */}
      <div className="flex justify-between items-center mb-10 mt-4.5">
        <h1 className="text-white text-4xl md:text-5xl font-black tracking-tight">Settings</h1>
      </div>

      {/* 核心双列布局区 */}
      <div className="grow grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-10 items-start">

        {/* ===================== 左列 ===================== */}
        <div className="flex flex-col gap-10">

          {/* App / Display 区块 */}
          <section>
            <h3 className="text-xs font-bold text-white uppercase tracking-widest border-b border-[#282828] pb-2 mb-6">
              Application & Display
            </h3>

            <SettingRow
              label="Hardware Acceleration"
              sublabel="Turn this off if the app is slow or lagging. Requires restart."
              control={
                <Toggle
                  enabled={config.app.gpuAcceleration}
                  onChange={() => handleUpdateConfig("app", "gpuAcceleration", !config.app.gpuAcceleration)}
                />
              }
            />

            <SettingRow
              label="Developer Tools"
              sublabel="Enable developer mode for debugging."
              control={
                <Toggle
                  enabled={config.app.devTools}
                  onChange={() => handleUpdateConfig("app", "devTools", !config.app.devTools)}
                />
              }
            />

            <SettingRow
              label="Window Close Action"
              sublabel="What should happen when you click the close button?"
              control={
                <div className="relative">
                  <select
                    className={selectClass}
                    value={config.app.closeAction}
                    onChange={(e) => handleUpdateConfig("app", "closeAction", Number(e.target.value) as 0 | 1 | 2)}
                  >
                    <option value={0} className="bg-[#282828]">Minimize to Tray</option>
                    <option value={1} className="bg-[#282828]">Exit Application</option>
                    <option value={2} className="bg-[#282828]">Ask Every Time</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-white absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              }
            />
          </section>

          {/* Logging 区块 */}
          <section>
            <h3 className="text-xs font-bold text-white uppercase tracking-widest border-b border-[#282828] pb-2 mb-6">
              Logging & Diagnostics
            </h3>

            <SettingRow
              label="Log Level"
              control={
                <div className="relative">
                  <select
                    className={selectClass}
                    value={config.logging.level}
                    onChange={(e) => handleUpdateConfig("logging", "level", e.target.value as "debug" | "info" | "warn" | "error")}
                  >
                    <option value="debug" className="bg-[#282828]">Debug</option>
                    <option value="info" className="bg-[#282828]">Info</option>
                    <option value="warn" className="bg-[#282828]">Warn</option>
                    <option value="error" className="bg-[#282828]">Error</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-white absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              }
            />

            <SettingRow
              label="Enable File Logging"
              sublabel="Write logs to persistent files on disk."
              control={
                <Toggle
                  enabled={config.logging.enableFile}
                  onChange={() => handleUpdateConfig("logging", "enableFile", !config.logging.enableFile)}
                />
              }
            />
          </section>
        </div>

        {/* ===================== 右列 ===================== */}
        <div className="flex flex-col gap-10">

          {/* Backend 区块 */}
          <section>
            <h3 className="text-xs font-bold text-white uppercase tracking-widest border-b border-[#282828] pb-2 mb-6">
              Backend Service
            </h3>

            <SettingRow
              label="Auto Start Backend"
              sublabel="Automatically start the managed Go-Zero backend server."
              control={
                <Toggle
                  enabled={config.backend.autoStart}
                  onChange={() => handleUpdateConfig("backend", "autoStart", !config.backend.autoStart)}
                />
              }
            />

            <SettingRow
              label="Backend Host"
              control={
                <SettingInput
                  value={config.backend.host}
                  onChange={(v) => handleUpdateConfig("backend", "host", v)}
                />
              }
            />

            <SettingRow
              label="Backend Port"
              control={
                <SettingInput
                  type="number"
                  value={config.backend.port}
                  onChange={(v) => handleUpdateConfig("backend", "port", Number(v))}
                />
              }
            />
          </section>

          {/* Frontend 区块 */}
          <section>
            <h3 className="text-xs font-bold text-white uppercase tracking-widest border-b border-[#282828] pb-2 mb-6">
              Frontend Service
            </h3>

            <SettingRow
              label="Frontend Host"
              control={
                <SettingInput
                  value={config.frontend.host}
                  onChange={(v) => handleUpdateConfig("frontend", "host", v)}
                />
              }
            />

            <SettingRow
              label="Development Port"
              control={
                <SettingInput
                  type="number"
                  value={config.frontend.devPort}
                  onChange={(v) => handleUpdateConfig("frontend", "devPort", Number(v))}
                />
              }
            />
          </section>
        </div>

      </div>
    </div>
  );
};

export default SettingsPage;
