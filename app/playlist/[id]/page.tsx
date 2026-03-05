import { Play, MoreHorizontal, Clock, Heart, Shuffle, ArrowDownCircle, UserPlus, List } from "lucide-react";
import { cn } from "@/lib/utils";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ MOCK DATA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const PLAYLIST_INFO = {
  type: "公开歌单",
  title: "MIX",
  // 截图中的封面是一张拼图，这里用一张类似的暗色调图片替代
  cover: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=400&auto=format&fit=crop",
  creator: "Momo 和 momo",
  creatorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=64&auto=format&fit=crop",
  likes: "1个人收藏",
  totalSongs: "135 首歌曲",
  duration: "大约 8 小时",
  // 截图中是经典的深蓝色渐变
  themeColor: "from-[#0a4b75]"
};

const TRACK_LIST = [
  {
    id: 1,
    title: "Wait (Kygo Remix)",
    artist: "Mellow Uploads",
    album: "Wait",
    addedBy: "Momo",
    addedByAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=64&auto=format&fit=crop",
    dateAdded: "2024年9月24日",
    duration: "4:58",
    img: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=64&auto=format&fit=crop"
  },
  {
    id: 2,
    title: "Miku",
    artist: "Anamanaguchi, Hatsune Miku",
    album: "Miku",
    addedBy: "Momo",
    addedByAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=64&auto=format&fit=crop",
    dateAdded: "2024年9月24日",
    duration: "3:43",
    img: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=64&auto=format&fit=crop"
  },
  {
    id: 3,
    title: "床",
    artist: "草东没有派对",
    album: "瓦合",
    addedBy: "Momo",
    addedByAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=64&auto=format&fit=crop",
    dateAdded: "2024年9月24日",
    duration: "3:52",
    img: "https://images.unsplash.com/photo-1621360811013-c76831f1628c?q=80&w=64&auto=format&fit=crop"
  },
  {
    id: 4,
    title: "山海",
    artist: "草东没有派对",
    album: "丑奴儿",
    addedBy: "Momo",
    addedByAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=64&auto=format&fit=crop",
    dateAdded: "2024年9月24日",
    duration: "4:11",
    img: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=64&auto=format&fit=crop"
  },
  {
    id: 5,
    title: "烂泥",
    artist: "草东没有派对",
    album: "丑奴儿",
    addedBy: "Momo",
    addedByAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=64&auto=format&fit=crop",
    dateAdded: "2024年9月24日",
    duration: "2:29",
    img: "https://images.unsplash.com/photo-1493225457124-a1a2a44bb447?q=80&w=64&auto=format&fit=crop"
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ COMPONENTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function PlaylistPage() {
  // 定义统一的 Grid 列比例，确保表头和表体严格对齐
  // 对应截图：# | 标题 | 专辑 | 添加者 | 添加日期 | 时长
  const gridTemplate = "grid-cols-[16px_minmax(200px,6fr)_minmax(120px,3fr)_minmax(120px,2fr)_minmax(120px,3fr)_minmax(40px,auto)]";

  return (
    <div className="relative w-full min-h-full bg-[#121212] flex flex-col">

      {/* ==================== 顶部背景渐变 ==================== */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-100 bg-linear-to-b via-[#121212]/80 to-[#121212] -z-10 pointer-events-none",
          PLAYLIST_INFO.themeColor
        )}
        aria-hidden="true"
      />

      {/* ==================== Header 歌单信息 ==================== */}
      <div className="flex items-end gap-6 px-6 pt-24 pb-6">
        {/* 封面图：带强烈阴影，截图中的尺寸稍大 */}
        <div className="w-48 h-48 lg:w-58 lg:h-58 shrink-0 shadow-[0_4px_60px_rgba(0,0,0,0.5)]">
          <img
            src={PLAYLIST_INFO.cover}
            alt="Playlist Cover"
            className="w-full h-full object-cover"
          />
        </div>

        {/* 文字信息 */}
        <div className="flex flex-col gap-2 text-white overflow-hidden pb-1">
          <span className="text-sm font-medium">{PLAYLIST_INFO.type}</span>
          {/* 截图中的标题非常巨大，使用 7xl/8xl 和紧凑字间距 */}
          <h1 className="text-7xl lg:text-[6rem] font-black tracking-tighter truncate py-1 leading-none mb-4">
            {PLAYLIST_INFO.title}
          </h1>

          <div className="flex items-center gap-1.5 text-sm font-medium mt-1 text-white/90">
            {/* 头像 + 联合创建者 */}
            <img
              src={PLAYLIST_INFO.creatorAvatar}
              alt={PLAYLIST_INFO.creator}
              className="w-6 h-6 rounded-full object-cover"
            />
            <span className="font-bold text-white hover:underline cursor-pointer">{PLAYLIST_INFO.creator}</span>
            <span className="text-white/60">•</span>
            <span>{PLAYLIST_INFO.likes}</span>
            <span className="text-white/60">•</span>
            <span>{PLAYLIST_INFO.totalSongs}, {PLAYLIST_INFO.duration}</span>
          </div>
        </div>
      </div>

      {/* ==================== 渐变底色遮罩 ==================== */}
      <div className="bg-black/20 w-full flex-1 relative flex flex-col">

        {/* ==================== 动作栏 (Action Bar) ==================== */}
        <div className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-6">
            <button className="bg-[#1ed760] hover:bg-[#3be477] hover:scale-105 transition-all text-black rounded-full w-14 h-14 flex items-center justify-center shadow-lg">
              <Play className="w-7 h-7 ml-1" fill="currentColor" />
            </button>
            {/* 截图新增：随机播放、下载、邀请、更多 */}
            <button className="text-[#1ed760] hover:text-[#3be477] transition-colors relative">
              <Shuffle className="w-8 h-8" />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1ed760] rounded-full"></div>
            </button>
            <button className="text-zinc-400 hover:text-white transition-colors">
              <ArrowDownCircle className="w-8 h-8" />
            </button>
            <button className="text-zinc-400 hover:text-white transition-colors">
              <UserPlus className="w-8 h-8" />
            </button>
            <button className="text-zinc-400 hover:text-white transition-colors">
              <MoreHorizontal className="w-8 h-8" />
            </button>
          </div>

          {/* 截图新增：右侧列表视图切换 */}
          <div className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white cursor-pointer transition-colors font-medium">
            <span>列表</span>
            <List className="w-5 h-5" />
          </div>
        </div>

        {/* ==================== 歌曲列表 (Tracklist) ==================== */}
        <div className="px-6 flex-1 pb-10">

          {/* 表头 (Sticky 吸顶) */}
          <div className={cn(
            "grid gap-4 px-4 py-2 text-sm font-medium text-zinc-400 border-b border-white/10 sticky top-0 bg-[#121212]/95 backdrop-blur-sm z-10",
            gridTemplate
          )}>
            <div className="text-right">#</div>
            <div>标题</div>
            <div className="hidden md:block">专辑</div>
            <div className="hidden lg:block">添加者：</div>
            <div className="hidden lg:block">添加日期</div>
            <div className="flex justify-end"><Clock className="w-4 h-4" /></div>
          </div>

          {/* 表体 */}
          <div className="pt-4 space-y-1">
            {TRACK_LIST.map((track, index) => (
              <div
                key={track.id}
                className={cn(
                  "group grid gap-4 px-4 py-2 hover:bg-white/10 rounded-md transition-colors items-center cursor-default",
                  gridTemplate
                )}
              >
                {/* 序号 / 播放按钮切换 */}
                <div className="text-zinc-400 text-right text-base font-medium flex justify-end items-center h-full">
                  <span className="group-hover:hidden">{index + 1}</span>
                  <Play className="w-4 h-4 hidden group-hover:block text-white" fill="currentColor" />
                </div>

                {/* 标题列 (包含图片) */}
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 shrink-0 bg-zinc-800 rounded">
                    <img src={track.img} alt={track.title} className="w-full h-full object-cover rounded" />
                  </div>
                  <div className="flex flex-col truncate">
                    <span className="text-white text-base font-normal truncate group-hover:underline cursor-pointer">{track.title}</span>
                    <span className="text-zinc-400 text-sm hover:text-white hover:underline cursor-pointer truncate">{track.artist}</span>
                  </div>
                </div>

                {/* 专辑列 */}
                <div className="text-sm text-zinc-400 hover:text-white hover:underline cursor-pointer truncate hidden md:block">
                  {track.album}
                </div>

                {/* 截图新增：添加者头像与名字 */}
                <div className="text-sm text-zinc-400 items-center gap-2 truncate hidden lg:flex hover:text-white hover:underline cursor-pointer">
                  <img src={track.addedByAvatar} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                  <span className="truncate">{track.addedBy}</span>
                </div>

                {/* 添加时间 */}
                <div className="text-sm text-zinc-400 truncate hidden lg:block">
                  {track.dateAdded}
                </div>

                {/* 时长列与操作图标 */}
                <div className="text-sm text-zinc-400 flex justify-end gap-4 items-center">
                  <Heart className="w-4 h-4 opacity-0 group-hover:opacity-100 hover:text-white cursor-pointer transition-opacity" />
                  <span>{track.duration}</span>
                  <MoreHorizontal className="w-4 h-4 opacity-0 group-hover:opacity-100 hover:text-white cursor-pointer transition-opacity" />
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
