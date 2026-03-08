'use client';

import React, { useState, useEffect, useReducer, ReactNode } from "react";
import {
  Library,
  Plus,
  ArrowRight,
  PanelLeftClose,
  Menu,
  PanelRightClose,
  Search,
  Home,
  Play,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Volume2,
  Mic2,
  ListMusic,
  MonitorSpeaker,
  Maximize2
} from "lucide-react";
import { Group, Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";
import { cn } from "@/lib/utils";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 模拟数据 (Mock Data) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const MOCK_PLAYLISTS = [
  { id: 1, title: "流行金曲 2024", subtitle: "播放列表 • 50万次点赞", coverImg: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&h=300&fit=crop" },
  { id: 2, title: "解压民谣", subtitle: "播放列表 • 28万次点赞", coverImg: "https://images.unsplash.com/photo-1459749411177-042180ce673c?w=300&h=300&fit=crop" },
  { id: 3, title: "另类摇滚", subtitle: "播放列表 • 32万次点赞", coverImg: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=300&h=300&fit=crop" },
  { id: 4, title: "节奏布鲁斯经典", subtitle: "播放列表 • 45万次点赞", coverImg: "https://images.unsplash.com/photo-1514525253344-a8135a43cf67?w=300&h=300&fit=crop" },
];

const MOCK_ARTISTS = [
  { id: 5, title: "Taylor Swift", subtitle: "流行歌手", coverImg: "https://images.unsplash.com/photo-1543185377-99cd19911180?w=300&h=300&fit=crop" },
  { id: 6, title: "Ed Sheeran", subtitle: "民谣歌手", coverImg: "https://images.unsplash.com/photo-1583795128727-6ec3642408f8?w=300&h=300&fit=crop" },
  { id: 7, title: "Billie Eilish", subtitle: "另类音乐人", coverImg: "https://images.unsplash.com/photo-1598387181032-a3103a2db5b3?w=300&h=300&fit=crop" },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 辅助组件 (Internal Components) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 简化版 DropdownMenu (模拟 shadcn 行为)
const CustomDropdown = ({ trigger, children, isCollapsed }: { trigger: ReactNode, children: ReactNode, isCollapsed: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className={cn(
            "absolute z-50 w-48 bg-[#282828] border border-zinc-800 rounded-md shadow-xl py-1 text-zinc-300",
            isCollapsed ? "left-0 mt-2" : "right-0 mt-2"
          )}>
            {children}
          </div>
        </>
      )}
    </div>
  );
};

// 库项目组件
const LibraryItem = ({ title, subtitle, coverImg, isCollapsed }: any) => {
  if (isCollapsed) {
    return (
      <div className="flex items-center justify-center w-full h-14 hover:bg-[#1a1a1a] rounded-md transition-colors cursor-pointer active:scale-95 group">
        <div className="w-12 h-12 rounded-md overflow-hidden shadow-lg transition-transform group-hover:scale-110">
          <img src={coverImg} alt={title} className="w-full h-full object-cover" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-2 hover:bg-[#1a1a1a] rounded-md cursor-pointer transition-colors group">
      <div className="w-12 h-12 rounded-md shrink-0 overflow-hidden shadow-md transition-transform group-hover:scale-105">
        <img src={coverImg} alt={title} className="w-full h-full object-cover" />
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-white truncate text-sm font-medium group-hover:text-white">{title}</span>
        <span className="text-zinc-400 text-xs truncate mt-0.5">{subtitle}</span>
      </div>
    </div>
  );
};

// 侧边栏菜单按钮
const SiderBarMenu = ({ isCollapsed }: { isCollapsed: boolean }) => {
  return (
    <CustomDropdown
      isCollapsed={isCollapsed}
      trigger={
        <button className="p-2 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-[#1a1a1a]">
          <Menu className="w-5 h-5" />
        </button>
      }
    >
      <div className="px-3 py-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">侧边栏设置</div>
      <div className="h-[1px] bg-zinc-800 my-1" />
      <div className="px-2 py-1.5 text-sm hover:bg-zinc-800 cursor-pointer flex items-center">
        <PanelRightClose className="w-4 h-4 mr-2" /> 展开
      </div>
      <div className="px-2 py-1.5 text-sm hover:bg-zinc-800 cursor-pointer flex items-center">
        <PanelLeftClose className="w-4 h-4 mr-2" /> 折叠
      </div>
      <div className="mt-2 px-3 py-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">播放列表</div>
      <div className="h-[1px] bg-zinc-800 my-1" />
      <div className="px-2 py-1.5 text-sm hover:bg-zinc-800 cursor-pointer flex items-center">
        <Plus className="w-4 h-4 mr-2" /> 创建播放列表
      </div>
    </CustomDropdown>
  );
};

// 侧边栏组件
const Sidebar = ({ isCollapsed }: { isCollapsed: boolean }) => {
  const [filter, setFilter] = useState<"ALL" | "PLAYLISTS" | "ARTISTS">("ALL");

  return (
    <div className="flex flex-col h-full w-full bg-[#121212] rounded-lg overflow-hidden transition-all">
      <div className={cn(
        "flex items-center p-4 text-zinc-400 shrink-0",
        isCollapsed ? "flex-col gap-4 px-2" : "justify-between"
      )}>
        <div className={cn("flex items-center gap-2 hover:text-white cursor-pointer transition-colors font-semibold", isCollapsed && "justify-center")}>
          <Library className={cn("w-6 h-6", isCollapsed && "w-7 h-7")} />
          {!isCollapsed && <span className="truncate">你的媒体库</span>}
        </div>
        <div className={cn("flex items-center gap-1", isCollapsed && "flex-col")}>
          <SiderBarMenu isCollapsed={isCollapsed} />
          {!isCollapsed && (
            <div className="flex items-center">
              <button className="p-2 hover:text-white transition-colors rounded-full hover:bg-[#1a1a1a]">
                <Plus className="w-5 h-5" />
              </button>
              <button className="p-2 hover:text-white transition-colors rounded-full hover:bg-[#1a1a1a]">
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <div className="flex gap-2 px-4 mb-3 overflow-x-auto shrink-0 no-scrollbar">
          {["ALL", "PLAYLISTS", "ARTISTS"].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type as any)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-bold transition-all flex justify-center shrink-0",
                filter === type ? "bg-white text-black" : "bg-[#242424] text-white hover:bg-[#2a2a2a]"
              )}
            >
              {type === "ALL" ? "全部" : type === "PLAYLISTS" ? "播放列表" : "艺人"}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-2 space-y-1 pb-2 custom-scrollbar">
        {(filter === "ALL" || filter === "PLAYLISTS") && MOCK_PLAYLISTS.map(item => <LibraryItem key={item.id} {...item} isCollapsed={isCollapsed} />)}
        {(filter === "ALL" || filter === "ARTISTS") && MOCK_ARTISTS.map(item => <LibraryItem key={item.id} {...item} isCollapsed={isCollapsed} />)}
      </div>
    </div>
  );
};

// 头部组件
const Header = ({ onOpenSearch }: { onOpenSearch: () => void }) => (
  <header className="flex items-center justify-between p-4 bg-transparent sticky top-0 z-10">
    <div className="flex items-center gap-2">
      <div className="flex gap-2 mr-4">
        <button className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-zinc-400 cursor-not-allowed">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M11.03.47a.75.75 0 010 1.06L5.56 7.5l5.47 5.97a.75.75 0 01-1.06 1.06l-6.5-7.03a.75.75 0 010-1.06l6.5-7.03a.75.75 0 011.06 0z" /></svg>
        </button>
        <button className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-zinc-400 cursor-not-allowed">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4.97.47a.75.75 0 000 1.06L10.44 7.5l-5.47 5.97a.75.75 0 001.06 1.06l6.5-7.03a.75.75 0 000-1.06L6.03.47a.75.75 0 00-1.06 0z" /></svg>
        </button>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <button onClick={onOpenSearch} className="flex items-center gap-2 bg-[#242424] hover:bg-[#2a2a2a] transition-all px-4 py-2 rounded-full text-zinc-400 group border border-transparent hover:border-zinc-700">
        <Search className="w-4 h-4 group-hover:text-white" />
        <span className="text-sm font-medium">搜索</span>
        <span className="ml-8 text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">Ctrl K</span>
      </button>
      <button className="bg-white text-black text-sm font-bold px-4 py-2 rounded-full hover:scale-105 transition-transform">
        查看方案
      </button>
      <button className="w-8 h-8 rounded-full bg-[#1db954] text-white flex items-center justify-center font-bold">
        M
      </button>
    </div>
  </header>
);

// 播放条组件
const PlayerBar = () => (
  <div className="h-20 bg-black border-t border-zinc-900/50 flex items-center px-4 justify-between select-none">
    {/* 正在播放内容 */}
    <div className="flex items-center gap-4 w-[30%]">
      <img src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100&h=100&fit=crop" className="w-14 h-14 rounded-md shadow-lg" alt="Cover" />
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-medium text-white truncate hover:underline cursor-pointer">流行金曲 2024</span>
        <span className="text-xs text-zinc-400 truncate hover:underline cursor-pointer">Taylor Swift</span>
      </div>
    </div>

    {/* 控制器 */}
    <div className="flex flex-col items-center max-w-[40%] w-full gap-2">
      <div className="flex items-center gap-6">
        <Shuffle className="w-4 h-4 text-zinc-400 hover:text-white cursor-pointer" />
        <SkipBack className="w-5 h-5 text-zinc-400 hover:text-white cursor-pointer fill-current" />
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform cursor-pointer">
          <Play className="w-5 h-5 text-black fill-current ml-0.5" />
        </div>
        <SkipForward className="w-5 h-5 text-zinc-400 hover:text-white cursor-pointer fill-current" />
        <Repeat className="w-4 h-4 text-zinc-400 hover:text-white cursor-pointer" />
      </div>
      <div className="flex items-center gap-2 w-full text-[10px] text-zinc-500">
        <span>1:23</span>
        <div className="flex-1 h-1 bg-zinc-800 rounded-full relative group cursor-pointer">
          <div className="absolute top-0 left-0 w-[40%] h-full bg-[#1db954] rounded-full group-hover:bg-[#1ed760]" />
        </div>
        <span>3:45</span>
      </div>
    </div>

    {/* 附加功能 */}
    <div className="flex items-center justify-end gap-3 w-[30%] text-zinc-400">
      <Mic2 className="w-4 h-4 hover:text-white cursor-pointer" />
      <ListMusic className="w-4 h-4 hover:text-white cursor-pointer" />
      <MonitorSpeaker className="w-4 h-4 hover:text-white cursor-pointer" />
      <div className="flex items-center gap-2 group w-24">
        <Volume2 className="w-4 h-4 hover:text-white cursor-pointer" />
        <div className="flex-1 h-1 bg-zinc-800 rounded-full relative">
          <div className="absolute top-0 left-0 w-[70%] h-full bg-white group-hover:bg-[#1db954] rounded-full" />
        </div>
      </div>
      <Maximize2 className="w-4 h-4 hover:text-white cursor-pointer" />
    </div>
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 主布局 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function App() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // 快捷键监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen]);

  return (
    <div className="w-full h-screen flex flex-col bg-black text-white font-sans overflow-hidden select-none p-2">
      {/* 搜索模态框模拟 */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-xl bg-[#282828] rounded-xl shadow-2xl border border-zinc-700 overflow-hidden">
            <div className="flex items-center px-4 py-3 border-b border-zinc-700">
              <Search className="w-5 h-5 text-zinc-400 mr-3" />
              <input
                autoFocus
                placeholder="你想听什么？"
                className="bg-transparent border-none outline-none flex-1 text-white placeholder-zinc-500"
              />
              <button onClick={() => setIsSearchOpen(false)} className="text-xs text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-800">ESC</button>
            </div>
            <div className="p-4 text-center text-zinc-500 text-sm">
              输入歌曲、艺人或播放列表名称进行搜索
            </div>
          </div>
        </div>
      )}

      {/* 核心内容区 */}
      <div className="flex-1 flex overflow-hidden gap-2 pb-2">
        <Group orientation="horizontal">
          {/* 左侧栏面板 */}
          <Panel
            defaultSize={20}
            maxSize={35}
            minSize={15}
            collapsible={true}
            collapsedSize={4}
            className="transition-all duration-300 ease-in-out"
          >
            <div className="h-full bg-[#0f0f0f] rounded-lg overflow-hidden">
              <Sidebar isCollapsed={isSidebarCollapsed} />
            </div>
          </Panel>

          {/* 调节柄 */}
          <PanelResizeHandle className="w-1 px-1 bg-transparent hover:bg-zinc-800 transition-colors group cursor-col-resize">
            <div className="w-px h-full bg-transparent group-hover:bg-zinc-600 transition-colors mx-auto" />
          </PanelResizeHandle>

          {/* 右侧主内容区 */}
          <Panel>
            <div className="h-full bg-[#121212] rounded-lg relative overflow-hidden flex flex-col min-w-0">
              <Header onOpenSearch={() => setIsSearchOpen(true)} />

              {/* 内容滚动区域 */}
              <main className="flex-1 overflow-y-auto relative p-6 scrollbar-custom">
                <div className="space-y-8">
                  <section>
                    <h2 className="text-2xl font-bold mb-4">为你推荐</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                      {[...MOCK_PLAYLISTS, ...MOCK_ARTISTS].map(item => (
                        <div key={item.id} className="bg-[#181818] hover:bg-[#282828] p-4 rounded-lg transition-all group cursor-pointer">
                          <div className="relative mb-4 aspect-square">
                            <img src={item.coverImg} className="w-full h-full object-cover rounded-md shadow-lg" alt={item.title} />
                            <div className="absolute bottom-2 right-2 w-12 h-12 bg-[#1db954] rounded-full flex items-center justify-center shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                              <Play className="w-6 h-6 text-black fill-current ml-1" />
                            </div>
                          </div>
                          <h3 className="text-sm font-bold truncate mb-1">{item.title}</h3>
                          <p className="text-xs text-zinc-400 line-clamp-2">{item.subtitle}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </main>
            </div>
          </Panel>
        </Group>
      </div>

      {/* 底部播放条 */}
      <PlayerBar />
    </div>
  );
}
