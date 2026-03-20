import { motion } from "motion/react";
import { toast } from "sonner";
import { SongTitle } from "../Marquee";
import { SongDetail } from "@/types/api/music";

export const showSongPlayToast = (song: SongDetail) => {
  // NOTE: 自定义 Toast 内容
  toast.custom((id) => (
    <div
      key={id}
      // 背景更深，去掉了大 padding，改为 p-2 让图片贴边，右侧留出空间
      className="flex items-center gap-3 bg-[#181818] text-white p-2 pr-6 rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.6)] border border-white/5 min-w-70 max-w-sm pointer-events-auto transition-all hover:bg-[#282828]"
      onClick={() => toast.dismiss(id)} // 点击可以关闭
    >
      {/* 封面：干净利落，没有遮挡，只有微妙的阴影 */}
      <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden shadow-md">
        <img src={song.al.picUrl} className="w-full h-full object-cover" alt="cover" />
      </div>

      {/* 文字区域：规范化 Spotify 的灰度字色 */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="font-bold text-sm text-white truncate">
          <SongTitle title={song.name} />
        </div>
        <span className="ml-3 text-xs text-[#b3b3b3] truncate mt-0.5">
          {song.ar.map((a) => a.name).join(", ")}
        </span>
      </div>

      {/* NOTE:Spotify 标志性的绿色跳动频谱动画 */}
      <div className="flex items-end gap-0.5 h-3 shrink-0">
        {[0, 0.2, 0.4].map((delay, i) => (
          <motion.div
            key={i}
            className="w-0.5 bg-[#1ed760] rounded-full"
            animate={{ scaleY: [0.4, 1, 0.4] }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay,
              ease: "easeInOut",
            }}
            style={{ height: "100%", originY: 1 }}  // originY: 1 从底部开始缩放
          />
        ))}
      </div>

    </div>
  ), {
    duration: 3000,
    position: "top-center",
  });
};
