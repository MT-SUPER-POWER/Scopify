"use client";

import { useState } from 'react';
import { Play, MoreHorizontal, Clock, ChevronDown } from 'lucide-react';
import { useUserStore } from '@/store/module/user';
import { TbSettings } from "react-icons/tb";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// TODO: 个人主页数据从后端接口获取
const PROFILE_DATA = {
  name: useUserStore.getState().user?.nickname || "Your Name",
  type: "Person Profile",
  bio: "业余计算机爱好者 / 专注于后端、前端与底层开发。热爱开源，喜欢用代码解决实际问题。平时会研究 Linux 内核、分布式系统架构，偶尔也会折腾一些有趣的小工具。相信技术能改变世界，也相信好的代码是一种艺术。",
  avatar: useUserStore.getState().user?.avatarUrl || "https://picsum.photos/seed/profile/400/400",
  coverColor: "from-[#535353]",
  stats: {
    publicRepos: 42,
    followers: 1024,
    following: 128,
  },
  topSkills: [
    { id: 1, name: "Go / go-zero", type: "Backend Server", img: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original-wordmark.svg", album: "Contributions Development", proficiency: "1,420,034", duration: "3:45", active: true },
    { id: 2, name: "React / Next.js", type: "Frontend Framework", img: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg", album: "Modern Web Engineering", proficiency: "982,102", duration: "2:30", active: false },
    { id: 3, name: "C / C++", type: "Linux Kernel & System", img: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg", album: "Low-level & Kernel Development", proficiency: "754,291", duration: "4:15", active: false },
    { id: 4, name: "Python", type: "Scripts & Automation", img: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg", album: "Automation Toolkit", proficiency: "532,110", duration: "1:50", active: false },
    { id: 5, name: "Rust", type: "Learning & Systems", img: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-original.svg", album: "Systems Programming Exploration", proficiency: "120,405", duration: "2:10", active: false },
  ],
  projects: [
    { id: 1, title: "Go-Zero Microservice", desc: "High concurrency backend", img: "https://picsum.photos/seed/go/200/200" },
    { id: 2, title: "Next.js Dashboard", desc: "Fullstack web application", img: "https://picsum.photos/seed/react/200/200" },
    { id: 3, title: "Linux Kernel Module", desc: "Custom driver development", img: "https://picsum.photos/seed/c/200/200" },
    { id: 4, title: "Rust CLI Tool", desc: "Blazing fast terminal utility", img: "https://picsum.photos/seed/rust/200/200" },
    { id: 5, title: "Python Scraper", desc: "Automated data collection", img: "https://picsum.photos/seed/py/200/200" },
  ],
};

function CollapsibleBio({ text }: { text: string }) {
  const BIO_MAX_LENGTH = 30;
  const isLong = text.length > BIO_MAX_LENGTH;
  const shortText = isLong ? text.slice(0, BIO_MAX_LENGTH) + "..." : text;

  return (
    <div className="mb-3 max-w-md flex items-center gap-2">
      {/* 文字单行截断，flex-1 保证不撑开布局 */}
      <span className="text-gray-400 text-xs md:text-sm tracking-wide truncate">
        {shortText}
      </span>

      {/* 详情按钮独立在文字外，不影响截断 */}
      {isLong && (
        <Popover>
          <PopoverTrigger asChild>
            <button className="shrink-0 inline-flex items-center gap-0.5 text-white font-semibold text-xs hover:underline focus:outline-none">
              详情 <ChevronDown size={12} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-72 bg-[#282828] border border-white/10 text-white shadow-2xl rounded-xl p-4"
            side="bottom"
            align="center"
          >
            <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">Signature</p>
            <p className="text-sm text-gray-300 leading-relaxed">{text}</p>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-[#121212]">

        {/* 顶部 Hero 区域 */}
        <div className={`bg-linear-to-b ${PROFILE_DATA.coverColor} to-[#121212] pt-20 pb-6 px-6 md:px-8 flex flex-col md:flex-row items-center md:items-end gap-6`}>
          <img
            src={PROFILE_DATA.avatar}
            alt="Profile"
            className="w-48 h-48 rounded-full shadow-2xl object-cover"
          />
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <span className="text-sm font-semibold tracking-wider uppercase mb-2">
              {PROFILE_DATA.type}
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-4 tracking-tighter">
              {PROFILE_DATA.name}
            </h1>

            {/* Bio 折叠区域 */}
            <CollapsibleBio text={PROFILE_DATA.bio} />

            <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
              <span>{PROFILE_DATA.stats.publicRepos} Public Repos</span>
              <span className="w-1 h-1 rounded-full bg-white" />
              <span>{PROFILE_DATA.stats.followers} Followers</span>
              <span className="w-1 h-1 rounded-full bg-white" />
              <span>{PROFILE_DATA.stats.following} Following</span>
            </div>
          </div>
        </div>

        {/* 悬浮操作栏 */}
        <div className="px-6 md:px-8 py-4 flex items-center gap-4 z-10">
          <button className="w-14 h-14 rounded-full flex items-center justify-center hover:scale-115 transition shadow-lg">
            <TbSettings size={32} className='text-gray-400 hover:text-white cursor-pointer' />
          </button>
          <MoreHorizontal size={32} className="text-gray-400 hover:text-white cursor-pointer" />
        </div>

        {/* 热门技能列表 */}
        <div className="px-6 md:px-8 mt-4">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="w-10 text-center text-[#b3b3b3]">#</TableHead>
                <TableHead className="text-[#b3b3b3]">标题</TableHead>
                <TableHead className="hidden md:table-cell text-[#b3b3b3]">专辑</TableHead>
                <TableHead className="text-right text-[#b3b3b3]">
                  <Clock size={16} className="ml-auto" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PROFILE_DATA.topSkills.map((skill, index) => (
                <TableRow
                  key={skill.id}
                  onMouseEnter={() => setHoveredRow(skill.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className="border-none group hover:bg-white/10 transition-colors cursor-default"
                >
                  {/* 序号 / 播放 */}
                  <TableCell className="w-10 text-center text-[#b3b3b3]">
                    {hoveredRow === skill.id ? (
                      <Play size={16} fill="white" className="mx-auto cursor-pointer text-white" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </TableCell>

                  {/* 封面 + 标题 + 副标题 */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={skill.img}
                        alt={skill.name}
                        className="w-10 h-10 rounded shadow-sm object-contain bg-white/5 p-px shrink-0"
                      />
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-medium text-base text-white truncate cursor-pointer hover:underline">
                          {skill.name}
                        </span>
                        <span className="text-sm text-[#b3b3b3] truncate group-hover:text-white transition-colors cursor-pointer hover:underline">
                          {skill.type}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* 专辑 */}
                  <TableCell className="hidden md:table-cell text-sm text-[#b3b3b3] group-hover:text-white transition-colors cursor-pointer hover:underline truncate max-w-62.5">
                    {skill.album}
                  </TableCell>

                  {/* 时长 */}
                  <TableCell className="text-right text-sm text-[#b3b3b3] font-medium">
                    {skill.duration}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* 项目卡片列表 */}
        <div className="px-6 md:px-8 mt-10 mb-20">
          <h2 className="text-2xl font-bold mb-6 hover:underline cursor-pointer">Projects & Repositories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {PROFILE_DATA.projects.map(project => (
              <div key={project.id} className="bg-[#181818] p-4 rounded-md hover:bg-[#282828] transition duration-300 group cursor-pointer">
                <div className="relative w-full aspect-square mb-4 shadow-lg rounded-md overflow-hidden">
                  <img src={project.img} alt={project.title} className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 right-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <button className="w-12 h-12 bg-[#1ed760] rounded-full flex items-center justify-center shadow-xl hover:scale-105 hover:bg-[#1fdf64]">
                      <Play size={24} fill="black" stroke="black" className="ml-1" />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-white truncate mb-1">{project.title}</h3>
                <p className="text-sm text-gray-400 line-clamp-2">{project.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </main>
    </>
  );
}
