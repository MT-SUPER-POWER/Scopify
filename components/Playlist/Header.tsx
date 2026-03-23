"use client";

import React from "react";
import Image from "next/image";
import { PlaylistInfo } from "@/types/playlist";

// 日历封面直接内聚在用到它的地方即可
const DailyCalendarCover = () => {
    const today = new Date();
    const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const dayOfWeek = days[today.getDay()];
    const dateNum = today.getDate();

    return (
        <div className="w-full h-full shadow-[4px_0_10px_rgba(0,0,0,0.3)] z-10 shrink-0 flex flex-col rounded-md overflow-hidden bg-white select-none">
            <div className="h-[22%] bg-linear-to-b from-[#e34242] to-[#c42b2b] flex items-center justify-center border-b border-black/10">
                <span className="text-white text-lg md:text-xl font-medium tracking-widest">{dayOfWeek}</span>
            </div>
            <div className="flex-1 relative flex items-center justify-center bg-linear-to-b from-momo-light from-50% to-[#e6e6e6] to-50%">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-black/5 shadow-[0_1px_1px_rgba(255,255,255,0.8)] -translate-y-1/2" />
                <span className="text-7xl md:text-8xl font-black text-[#2a2a2a] font-sans z-10 tracking-tighter mt-2">{dateNum}</span>
            </div>
        </div>
    );
};

interface PlaylistHeaderProps {
    info: PlaylistInfo;
    isDaily: boolean;
}

const PlaylistHeader = ({ info, isDaily }: PlaylistHeaderProps) => {
    return (
        <div className="relative z-10 flex flex-col md:flex-row items-start gap-6 px-6 pt-24 pb-6">
            {/* 封面区 */}
            <div className="w-48 h-48 lg:w-56 lg:h-56 shrink-0 transition-transform duration-300 hover:scale-[1.02] shadow-[0_8px_40px_rgba(0,0,0,0.5)] rounded-md overflow-hidden bg-black/20">
                {isDaily || !info.cover ? (
                    <DailyCalendarCover />
                ) : (
                    <Image width={300} height={300} src={info.cover} alt={info.title} className="w-full h-full object-cover" />
                )}
            </div>

            {/* 信息区 */}
            <div className="flex flex-col flex-1 min-w-0 text-white pt-1 md:pt-2">
                <div className="flex flex-row gap-2 flex-wrap items-center mb-3 md:mb-4">
                    <span className="text-sm drop-shadow-md uppercase tracking-wider bg-white/10 px-3 py-1 rounded-sm">
                        {info.privacy}
                    </span>
                    {info.tags?.map((t, idx) => (
                        <span key={idx} className="text-[12px] font-medium drop-shadow-md px-3 py-1 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                            {t}
                        </span>
                    ))}
                </div>

                <h1 className="m-0 font-black tracking-tighter leading-[1.1] drop-shadow-lg mb-4 md:mb-6 wrap-break-word text-4xl md:text-5xl lg:text-6xl line-clamp-3" title={info.title}>
                    {info.title}
                </h1>

                <div className="flex flex-wrap items-center gap-2.5 text-sm text-white/80 drop-shadow-md">
                    {!info.isSpecial && (
                        <>
                            <div className="flex items-center gap-2 group cursor-pointer mr-1 text-white">
                                {info.creatorAvatar ? (
                                    <Image src={info.creatorAvatar} alt={info.creator} width={28} height={28} className="w-7 h-7 rounded-full object-cover" />
                                ) : (
                                    <div className="w-7 h-7 rounded-full bg-zinc-600 flex items-center justify-center text-xs font-bold"> M </div>
                                )}
                                <span className="font-bold group-hover:underline text-[15px]">{info.creator}</span>
                            </div>
                            <span className="opacity-60 hidden sm:inline">•</span>
                            <span>{info.createTime} 创建</span>
                            <span className="opacity-60">•</span>
                            <span>{info.likes.toLocaleString()} 次收藏</span>
                            <span className="opacity-60">•</span>
                        </>
                    )}
                    <span className="font-medium text-white">共 {info.totalSongs} 首歌</span>
                </div>
            </div>
        </div>
    );
};

// 使用 React.memo 包裹，只有当 info 引用发生变化时才重绘
export default React.memo(PlaylistHeader);
