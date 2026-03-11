import Link from "next/link";
import React from "react";
import LibItemContextMenu from "./LibItemMenu";

// 定义组件真正需要的属性，与后端 API 结构解耦
interface LibraryItemProps {
  id: string | number;
  title: string;
  subtitle: string;
  coverImg: string;
  isCollapsed?: boolean;
}

export const LibraryItem = ({
  id,
  title,
  subtitle,
  coverImg,
  isCollapsed,
}: LibraryItemProps) => {

  const href = `/playlist?id=${id}`;

  if (isCollapsed) {
    return (
      <LibItemContextMenu playlistID={id}>
        <Link href={href} title={title}
          className="flex items-center justify-center w-full h-14 hover:bg-[#1a1a1a] rounded-md transition-colors cursor-pointer active:scale-95 group">
          <div className="w-12 h-12 rounded-md overflow-hidden shadow-lg transition-transform group-hover:scale-110">
            <img src={coverImg} alt={title} className="w-full h-full object-cover" />
          </div>
        </Link>
      </LibItemContextMenu>
    );
  }

  return (
    <LibItemContextMenu playlistID={id}>
      <Link href={href} title={title}
        className="flex items-center gap-3 p-2 hover:bg-[#1a1a1a] rounded-md cursor-pointer transition-colors group">
        <div className="w-12 h-12 rounded-md shrink-0 overflow-hidden shadow-md transition-transform group-hover:scale-105">
          <img src={coverImg} alt={title} className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-white truncate text-base font-normal group-hover:text-white">
            {title}
          </span>
          <span className="text-zinc-400 text-sm truncate mt-0.5">
            {subtitle}
          </span>
        </div>
      </Link>
    </LibItemContextMenu>
  );
};

export default React.memo(LibraryItem);
