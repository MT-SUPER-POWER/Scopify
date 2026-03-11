"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { cn } from "@/lib/utils";
import { Search, ChevronLeft, Home } from "lucide-react";
import RightActions from "./Header/RightActions";
import { useEffect, useState } from "react";
import { useSmartRouter } from '@/lib/hooks/useSmartRouter';
import os from "node:os";
import Link from "next/link";
import { Input } from "./ui/input";
import { searchDefault, searchHot } from "@/lib/api/search";
import { search } from "@/backend/api-enhanced/interface";


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const Header = ({
  onOpenSearch,
  scrollContainer     // 受监听的另一个组件，监听是否其发生滚动，如果是，则 Header 显示背景，否则透明
}: {
  onOpenSearch?: () => void;
  scrollContainer: HTMLDivElement | null
}) => {

  const [isAtTop, setIsAtTop] = useState(true);
  const smartRouter = useSmartRouter();
  const [searchKeyword, setSearchKeyword] = useState("What do you want to listen to?");

  // 监听 scrollContainer 的滚动事件，改变 Header 的背景显示
  useEffect(() => {
    if (!scrollContainer) return;

    const handleScroll = () => {
      setIsAtTop(scrollContainer.scrollTop === 0);
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, [scrollContainer]);

  // 每隔 4s 更新一次搜索热词
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let isActive = true; // 退出标志位，防止组件卸载后还在强行更新状态
    const fetchHotWords = async () => {
      try {
        // 1. 加上 await 等待 Axios 请求真正完成
        const res = await searchHot();
        // console.log("搜索热词接口响应", res.data.result);
        // 如果请求期间组件已经卸载，直接中断
        if (!isActive) return;

        const hotList = res.data?.result.hots || [];
        if (hotList.length === 0) return;

        console.log("搜索建议获取成功", hotList);

        let currentIndex = 0;
        // 先立刻显示第一个词，避免前 4 秒是空白的
        setSearchKeyword(hotList[0].first);

        // 2. 开启定时器，每次只更新一个词
        interval = setInterval(() => {
          currentIndex = (currentIndex + 1) % hotList.length; // 利用取模实现循环：0, 1, 2... 0, 1, 2
          setSearchKeyword(hotList[currentIndex].first);
        }, 7000);

      } catch (error) {
        if (isActive) {
          console.error("获取搜索建议失败", error);
        }
      }
    };
    fetchHotWords();
    // 3. 必须要有清理函数
    return () => {
      isActive = false;
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  return (
    <div
      className={cn(
        "h-16 w-full flex items-center justify-between px-6 shrink-0 absolute gap-2 lg:gap-0",
        "top-0 z-20",
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-momo-grey/10 backdrop-blur-lg -z-10 transition-opacity duration-300 rounded-[10px]",
          isAtTop ? "opacity-0" : "opacity-100 border-b border-white/5"
        )}
      />

      {/* Navigation Arrows & Search */}
      <div className="flex items-center gap-4">
        {/* Router 前进后退操作 */}
        <div className="flex gap-2">
          <button onClick={() => smartRouter.back()}
            className={cn(
              "w-10 h-10 rounded-full bg-black/70 flex items-center justify-center text-zinc-400 hover:text-white"
            )}>
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* 搜索入口 */}
      <div className="flex flex-row gap-2 items-center justify-center w-95 min-w-0">

        <Link href="/"
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
            "text-zinc-400 bg-[#242424]",
            "active:scale-95 transition-all duration-150"
          )}
        >
          <Home className="w-6 h-6" />
        </Link>

        <button
          onClick={onOpenSearch}
          className={cn(
            "flex items-center gap-2 bg-[#242424] hover:bg-[#2a2a2a] transition-colors rounded-full",
            "px-4 py-3 flex-1 min-w-40 group",
            "cursor-pointer border border-transparent hover:border-zinc-700/50",
          )}
        >

          <Search className="w-5 h-5 shrink-0 text-zinc-400" />
          <span className="text-zinc-400 font-medium text-sm flex-1 text-left truncate" >
            {searchKeyword}
          </span>
          <div className="flex items-center gap-1 shrink-0 text-zinc-400 border border-zinc-600 rounded px-1.5 py-0.5 text-[10px] font-bold">
            <span>{os.type() === "Darwin" ? "⌘" : "Ctrl"}</span>
            <span>K</span>
          </div>
        </button>

      </div>

      {/* Right Actions */}
      <RightActions />

    </div>
  );
};

export default Header;
