"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { Play } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CONSTANTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const PROFILE_DATA = {
  name: "MT-SUPER-POWER",
  type: "Person Profile",
  bio: "计算机爱好者 / 专注于前端、后端开发。热爱开源，喜欢用代码解决实际问题。平时会研究嵌入式、游戏开发，偶尔也会折腾一些有趣的小工具。相信技术能改变世界，也相信好的代码是一种艺术。",
  avatar: "https://avatars.githubusercontent.com/u/255034182?v=4&size=512",
  coverColor: "from-[#535353]",
  topSkills: [
    {
      id: 1,
      name: "Go",
      category: "后端服务器",
      img: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original-wordmark.svg",
      field: "Gin / Go-Zero",
      proficiency: "7/10",
    },
    {
      id: 2,
      name: "React",
      category: "前端开发",
      img: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
      field: "Next.js / Shadcn UI / RN",
      proficiency: "8/10",
    },
    {
      id: 3,
      name: "C / C++",
      category: "嵌入式开发",
      img: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg",
      field: "HAL & Arduino & ESP-IDF",
      proficiency: "8/10",
    },
    {
      id: 4,
      name: "Python",
      category: "脚本 & 自动化",
      img: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",
      field: "部署、运维的小工具",
      proficiency: "6/10",
    },
    {
      id: 5,
      name: "Rust",
      category: "重构 & 优化",
      img: "https://miqh.gallerycdn.vsassets.io/extensions/miqh/vscode-language-rust/0.14.0/1536151476041/Microsoft.VisualStudio.Services.Icons.Default",
      field: "暂且不定",
      proficiency: "5/10",
    },
    {
      id: 6,
      name: "Java",
      category: "游戏开发",
      img: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg",
      field: "杀戮尖塔 mod 开发",
      proficiency: "6/10",
    },
  ],
  secondSkills: [
    {
      id: 7,
      name: "Redis",
      category: "内存缓存",
      img: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg",
      field: "高性能数据存储",
      proficiency: "8/10",
    },
    {
      id: 8,
      name: "MySQL",
      category: "关系型数据库",
      img: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg",
      field: "后端持久化存储",
      proficiency: "8/10",
    },
    {
      id: 9,
      name: "Elastic Search",
      category: "搜索 & 分析",
      img: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/elasticsearch/elasticsearch-original.svg",
      field: "日志分析 & 文档检索",
      proficiency: "6/10",
    },
    {
      id: 10,
      name: "k8s",
      category: "容器编排",
      img: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg",
      field: "微服务部署 & 运维",
      proficiency: "7/10",
    },
    {
      id: 11,
      name: "PostgreSQL",
      category: "关系型数据库",
      img: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg",
      field: "数据建模 & 存储",
      proficiency: "6/10",
    },
    {
      id: 12,
      name: "Etcd",
      category: "分布式配置",
      img: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/etcd.png",
      field: "服务注册与发现",
      proficiency: "6/10",
    },
  ],
  projects: [
    {
      id: 1,
      title: "Arknights-Mod-Shamare",
      desc: "杀戮尖塔同人 mod",
      img: "https://images.steamusercontent.com/ugc/2467499590591997226/4AB4E29967FD0AEF4D1229BA31EFE689D6E18D09/?imw=5000&imh=5000&ima=fit&impolicy=Letterbox&imcolor=%23000000&letterbox=false",
      url: "https://github.com/KhasAlushird/slay-the-spire-arknights-mod-Shamare?tab=readme-ov-file",
    },
    {
      id: 2,
      title: "Spotify Like Player",
      desc: "基于 Spotify UI 设计风格的音乐播放器",
      img: "https://cdn-icons-png.flaticon.com/512/16592/16592544.png",
      url: "https://github.com/MT-SUPER-POWER/scopify",
    },
    {
      id: 3,
      title: "Nes Stimulator",
      desc: "基于 Rust 的 NES 模拟器",
      img: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Nintendo-Famicom-Disk-System.jpg/250px-Nintendo-Famicom-Disk-System.jpg",
      url: "https://github.com/MT-SUPER-POWER/nes_emulator",
    },
    {
      id: 4,
      title: "NeteaseCloud API",
      desc: "网易云后台 API",
      img: "https://cdnb.artstation.com/p/assets/images/images/059/230/111/large/wg-sketch1675772121021.jpg?1675923493",
      url: "https://github.com/MT-SUPER-POWER/api-enhanced",
    },
  ],
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function MePage() {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  return (
    <main className="flex-1 overflow-y-auto bg-[#121212]">
      {/* 顶部 Hero 区域 */}
      <div
        className={`bg-linear-to-b ${PROFILE_DATA.coverColor} to-[#121212] pt-20 pb-6 px-6 md:px-8 flex flex-col md:flex-row
        items-center md:items-end gap-6`}
      >
        <Image
          width={192}
          height={192}
          src={PROFILE_DATA.avatar}
          alt="Profile"
          className="w-48 h-48 rounded-full shadow-2xl object-cover"
        />
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          {/* 标签 */}
          <span className="text-[12px] font-semibold drop-shadow-md px-3 py-1 bg-white/10 rounded-full">
            {PROFILE_DATA.type}
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-4 tracking-tighter">
            {PROFILE_DATA.name}
          </h1>
          {/* 个人简介部分 */}
          <div className="max-w-175">
            <span className="text-[#b3a47a] text-sm">{PROFILE_DATA.bio}</span>
          </div>
        </div>
      </div>

      <div className="h-10" />

      {/* 主技术栈 */}
      <div className="px-6 md:px-8 mt-4">
        <h2 className="text-3xl font-bold mb-6 hover:underline cursor-pointer">语言 & 框架</h2>
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="w-10 text-center text-[#b3b3b3]">#</TableHead>
              <TableHead className="text-[#b3b3b3]">
                <div className="w-full flex items-center">技术栈</div>
              </TableHead>
              <TableHead className="hidden md:table-cell text-[#b3b3b3]">方向</TableHead>
              <TableHead className="text-[#b3b3b3]"> 熟练度 </TableHead>
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
                <TableCell className="w-10 text-center text-[#b3b3b3]">
                  {hoveredRow === skill.id ? (
                    <Play size={16} fill="white" className="mx-auto cursor-pointer text-white" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-3">
                    <Image
                      src={skill.img}
                      alt={skill.name}
                      className="w-10 h-10 rounded shadow-sm object-contain bg-white/5 p-px shrink-0"
                      width={40}
                      height={40}
                    />
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-medium text-base text-white truncate cursor-pointer hover:underline">
                        {skill.name}
                      </span>
                      <span className="text-sm text-[#b3b3b3] truncate group-hover:text-white transition-colors cursor-pointer hover:underline">
                        {skill.category}
                      </span>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="hidden md:table-cell text-sm text-[#b3b3b3] group-hover:text-white transition-colors cursor-pointer hover:underline truncate max-w-62.5">
                  {skill.field}
                </TableCell>

                <TableCell className="text-sm text-[#b3b3b3] font-medium">
                  {skill.proficiency}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="h-14" />

      {/* 辅技术栈 */}
      <div className="px-6 md:px-8 mt-4">
        <h2 className="text-3xl font-bold mb-6 hover:underline cursor-pointer">开发工具</h2>
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="w-10 text-center text-[#b3b3b3]">#</TableHead>
              <TableHead className="text-[#b3b3b3]">
                <div className="w-full flex items-center">工具</div>
              </TableHead>
              <TableHead className="hidden md:table-cell text-[#b3b3b3]">方向</TableHead>
              <TableHead className="text-[#b3b3b3]"> 熟练度 </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {PROFILE_DATA.secondSkills.map((skill, index) => (
              <TableRow
                key={skill.id}
                onMouseEnter={() => setHoveredRow(skill.id)}
                onMouseLeave={() => setHoveredRow(null)}
                className="border-none group hover:bg-white/10 transition-colors cursor-default"
              >
                <TableCell className="w-10 text-center text-[#b3b3b3]">
                  {hoveredRow === skill.id ? (
                    <Play size={16} fill="white" className="mx-auto cursor-pointer text-white" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-3">
                    <Image
                      src={skill.img}
                      alt={skill.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded shadow-sm object-contain bg-white/5 p-px shrink-0"
                    />
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-medium text-base text-white truncate cursor-pointer hover:underline">
                        {skill.name}
                      </span>
                      <span className="text-sm text-[#b3b3b3] truncate group-hover:text-white transition-colors cursor-pointer hover:underline">
                        {skill.category}
                      </span>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="hidden md:table-cell text-sm text-[#b3b3b3] group-hover:text-white transition-colors cursor-pointer hover:underline truncate max-w-62.5">
                  {skill.field}
                </TableCell>

                <TableCell className="text-sm text-[#b3b3b3] font-medium">
                  {skill.proficiency}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 项目卡片列表 */}
      <div className="px-6 md:px-8 mt-10 mb-20">
        <h2 className="text-3xl font-bold mb-6 hover:underline cursor-pointer">项目 & 仓库</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {PROFILE_DATA.projects.map((project) => (
            <div
              key={project.id}
              className="bg-[#181818] p-4 rounded-md hover:bg-[#282828] transition duration-300 group cursor-pointer"
            >
              <div className="relative w-full aspect-square mb-4 shadow-lg rounded-md overflow-hidden">
                <Image
                  src={project.img}
                  alt={project.title}
                  width={100}
                  height={100}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 right-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <button type="button" className="w-12 h-12 bg-[#1ed760] rounded-full flex items-center justify-center shadow-xl hover:scale-105 hover:bg-[#1fdf64]">
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
  );
}
