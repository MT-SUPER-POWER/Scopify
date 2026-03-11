import { Play } from "lucide-react";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 生成卡片背景色的帮助函数
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const MockRouterContent = () => {
  return (
    <div className="relative pb-24 font-sans">
      {/* 顶部彩色渐变背景 (Spotify 标志性设计) */}
      {/* TODO: 彩色顶部渐变根据时间变化 */}
      <div className="absolute top-0 left-0 right-0 h-80 bg-linear-to-b from-indigo-900/80 via-[#121212]/80 to-[#121212] z-0 pointer-events-none" />

      <div className="relative z-10 p-6 pt-20 space-y-8">
        {/* 欢迎语与快速访问区块 */}
        <section>
          <h1 className="text-3xl font-bold text-white mb-6 tracking-tight">
            {getGreeting()}
          </h1>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="flex items-center h-16 bg-white/10 hover:bg-white/20 transition-colors rounded-md overflow-hidden group cursor-pointer relative pr-4"
              >
                <img
                  src={`https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=100&auto=format&fit=crop&sig=${item + 10}`}
                  alt="cover"
                  className="h-16 w-16 object-cover shadow-[4px_0_10px_rgba(0,0,0,0.3)] z-10"
                />
                <span className="text-white font-bold text-sm ml-4 truncate">
                  Daily Mix {item}
                </span>

                {/* 悬浮播放按钮 */}
                <button className="absolute right-4 w-10 h-10 bg-[#1ed760] rounded-full flex items-center justify-center text-black shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-20 hover:scale-105 hover:bg-[#1fdf64]">
                  <Play className="w-5 h-5 fill-current ml-1" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* 推荐区块 */}
        <section>
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-2xl font-bold text-white hover:underline cursor-pointer tracking-tight">
              Made For Momo
            </h2>
            <span className="text-sm text-zinc-400 font-bold hover:underline cursor-pointer">
              Show all
            </span>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="bg-[#181818] hover:bg-[#282828] transition-colors p-4 rounded-lg cursor-pointer group"
              >
                <div className="relative mb-4 pb-[100%]">
                  <img
                    src={`https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=300&auto=format&fit=crop&sig=${item}`}
                    alt="Playlist"
                    className="absolute inset-0 w-full h-full object-cover rounded-md shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
                  />
                  {/* 卡片上的悬浮播放按钮 */}
                  <button className="absolute bottom-2 right-2 w-12 h-12 bg-[#1ed760] rounded-full flex items-center justify-center text-black shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 hover:bg-[#1fdf64]">
                    <Play className="w-6 h-6 fill-current ml-1" />
                  </button>
                </div>
                <h3 className="text-white font-bold truncate mb-1">
                  Discover Weekly
                </h3>
                <p className="text-sm text-zinc-400 line-clamp-2">
                  New music from artists you love, updated every Friday.
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
