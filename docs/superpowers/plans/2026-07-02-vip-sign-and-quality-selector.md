# 网易乐签 + 音质选择器 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 ProfileMenu 中添加网易乐签（VIP 签到卡片）功能，在 PlayBar 中添加音质选择器下拉菜单

**Architecture:** 两个功能相互独立。网易乐签采用 API → Modal 卡片链式调用；音质选择器采用 DropdownMenu + Zustand 持久化 + 播放 URL 请求时传入 level 参数

**Tech Stack:** Next.js (App Router), Zustand (persist), Radix UI / shadcn DropdownMenu, react-icons/lucide-react, @applemusic-like-lyrics/react, axios

## Global Constraints

- Cookie 通过 `localStorage.getItem("music_cookie")` 获取，以 `params.cookie` 传递给后端
- 音质选项通过 zustand persist 持久化到 localStorage
- i18n 同步维护 zh-CN、zh-TW、en-US 三个语言
- 后端模块已存在，无需修改后端
- `lib/api/music.ts`（音质相关 API 类型和方法）**已在设计阶段完成实现**

---

## 文件结构

| 文件                                  | 角色 | 责任                                                          |
| ------------------------------------- | ---- | ------------------------------------------------------------- |
| `types/api/vipSign.ts`                | 新建 | VipSignRecord 等类型定义                                      |
| `lib/api/user.ts`                     | 修改 | 新增 `vipSign`、`vipSignInfo` 方法                            |
| `store/module/player.tsx`             | 修改 | 新增 `musicQuality` / `setMusicQuality`；`playTrack` 集成音质 |
| `components/Header/ProfileMenu.tsx`   | 修改 | 新增"网易乐签"菜单项 + 处理函数                               |
| `components/VipSign/VipSignModal.tsx` | 新建 | 签到卡片 Modal（Dialog 容器）                                 |
| `components/VipSign/index.ts`         | 新建 | barrel export                                                 |
| `components/PlayerBar.tsx`            | 修改 | 新增音质 DropdownMenu                                         |
| `lib/i18n.ts`                         | 修改 | 新增两个功能所需的翻译键                                      |

---

### Task 1: VIP 签到类型定义 + API 方法

**Files:**

- Create: `types/api/vipSign.ts`
- Modify: `lib/api/user.ts`

**Interfaces:**

- Produces: `VipSignRecord`, `VipSignInfoResponse`, `VipSignResponse` 类型；`vipSign(cookie?)`, `vipSignInfo(cookie?)` 方法

- [ ] **Step 1: 创建类型文件 `types/api/vipSign.ts`**

```typescript
export interface VipSignRecord {
  recordId: number;
  userId: number;
  time: number;
  timeStr: string; // "2026-07-01"
  songId: number;
  songCover: string | null;
  score: number;
  today: boolean;
}

export interface VipSignInfoResponse {
  code: number;
  data: VipSignRecord[];
  message: string;
}

export interface VipSignResponse {
  code: number;
  data: boolean;
  message: string;
}
```

- [ ] **Step 2: 在 `lib/api/user.ts` 末尾添加签到 API 方法**

```typescript
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 网易乐签
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import type { VipSignInfoResponse, VipSignResponse } from "@/types/api/vipSign";

/** 网易乐签 - VIP签到 POST /vip/sign */
export function vipSign(cookie?: string) {
  return request.post<VipSignResponse>("/vip/sign", {}, {
    params: { cookie },
    noRetry: true,
  } as any);
}

/** 网易乐签 - 签到信息 GET /vip/sign/info */
export function vipSignInfo(cookie?: string) {
  return request.get<VipSignInfoResponse>("/vip/sign/info", {
    params: { cookie },
    noRetry: true,
  } as any);
}
```

- [ ] **Step 3: Verify and commit**

Run: `bun run check` (biome lint)
Expected: no errors

Commit:

```bash
git add types/api/vipSign.ts lib/api/user.ts
git commit -m "feat(vip-sign): add types and API methods for NetEase VIP check-in

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: i18n 翻译键

**Files:**

- Modify: `lib/i18n.ts`

**Interfaces:**

- Produces: 两个功能所需的翻译键

- [ ] **Step 1: 在 `lib/i18n.ts` 的 `profile.menu.aboutMe` 行后新增 VIP 签到翻译键**

找到 `"profile.menu.aboutMe": "关于我"` 行，在其后添加：

```typescript
"profile.menu.vipSign": "网易乐签",
```

在文件末尾附近的 zhTW 和 enUS 块中对应添加。

然后在 `zhCN` 中找一个合适的位置（比如 `vipSign` 相关键放在 profile 区域之后）添加：

```typescript
"vipSign.title": "签到",
"vipSign.alreadySigned": "今天已签到",
"vipSign.notMember": "非黑胶会员无法签到",
"vipSign.consecutiveDays": "连续签到 {{days}} 天",
"vipSign.recommendedSong": "今日推荐",
"vipSign.success": "签到成功",
"vipSign.failed": "签到失败: {{message}}",
```

以及在 `zhTW` 中添加繁体翻译：

```typescript
"profile.menu.vipSign": "網易樂簽",
"vipSign.title": "簽到",
"vipSign.alreadySigned": "今天已簽到",
"vipSign.notMember": "非黑膠會員無法簽到",
"vipSign.consecutiveDays": "連續簽到 {{days}} 天",
"vipSign.recommendedSong": "今日推薦",
"vipSign.success": "簽到成功",
"vipSign.failed": "簽到失敗: {{message}}",
```

在 `enUS` 中添加英文翻译：

```typescript
"profile.menu.vipSign": "VIP Check-in",
"vipSign.title": "Check-in",
"vipSign.alreadySigned": "Already checked in today",
"vipSign.notMember": "VIP membership required",
"vipSign.consecutiveDays": "{{days}} consecutive days",
"vipSign.recommendedSong": "Today's Pick",
"vipSign.success": "Check-in successful!",
"vipSign.failed": "Check-in failed: {{message}}",
```

然后在 `zhCN` 中添加音质选择器的翻译键：

```typescript
"playbar.quality": "音质选择",
"playbar.qualityTitle": "音质级别",
```

以及对应的 zhTW 和 enUS：

```typescript
// zhTW
"playbar.quality": "音質選擇",
"playbar.qualityTitle": "音質級別",

// enUS
"playbar.quality": "Audio Quality",
"playbar.qualityTitle": "Quality Level",
```

- [ ] **Step 2: Verify and commit**

Run: `bun run check` (biome lint / type check)
Expected: no errors

Commit:

```bash
git add lib/i18n.ts
git commit -m "feat(i18n): add VIP sign and audio quality translation keys

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: ProfileMenu 新增"网易乐签"菜单项

**Files:**

- Modify: `components/Header/ProfileMenu.tsx`

**Interfaces:**

- Consumes: `vipSign(cookie?)`, `vipSignInfo(cookie?)` from `lib/api/user`
- Consumes: `VipSignRecord` from `types/api/vipSign`
- Consumes: `t("profile.menu.vipSign")` from i18n
- Produces: 点击菜单项 → 签到 → 打开 VipSignModal
- Depends on: Task 1 (API), Task 2 (i18n)

- [ ] **Step 1: 在 ProfileMenu.tsx 引入日历图标和 API**

在顶部 import 块中添加：

```typescript
import { FiCalendar } from "react-icons/fi";
import { vipSign, vipSignInfo } from "@/lib/api/user";
import type { VipSignRecord } from "@/types/api/vipSign";
```

- [ ] **Step 2: 在 ProfileMenu 组件中添加 state 和 handler**

在组件函数体内，`const handleLoginClick` 之前添加：

```typescript
const [signModalOpen, setSignModalOpen] = useState(false);
const [signRecords, setSignRecords] = useState<VipSignRecord[]>([]);

const handleVipSign = async () => {
  const cookie = typeof window !== "undefined" ? localStorage.getItem("music_cookie") : null;
  try {
    const res = await vipSign(cookie ?? undefined);
    const signData = res.data;
    if (signData.code === 200) {
      const info = await vipSignInfo(cookie ?? undefined);
      setSignRecords(info.data.data ?? []);
      setSignModalOpen(true);
    } else {
      toast.error(signData.message || t("vipSign.failed", { message: "" }));
    }
  } catch (err: any) {
    const msg = err?.businessMsg || err?.message || "";
    toast.error(t("vipSign.failed", { message: msg }));
  }
};
```

添加 useState import（顶部已有的 import 中补充）：

```typescript
import { useState } from "react";
```

添加 toast import：

```typescript
import { toast } from "sonner";
```

- [ ] **Step 3: 在 JSX 中新增菜单项**

在 `{isLoggedIn && ...}` 区块中（`FiUser` 菜单项之后），添加：

```tsx
<DropdownMenuItem onSelect={handleVipSign} className="rounded-lg px-3 py-2 text-[15px]">
  <FiCalendar className="mr-2 h-5 w-5" />
  <span>{t("profile.menu.vipSign")}</span>
</DropdownMenuItem>
```

- [ ] **Step 4: 在组件末尾添加 Modal**

在 `</DropdownMenuContent></DropdownMenu>` 之后添加：

```tsx
{
  signModalOpen && (
    <VipSignModal
      open={signModalOpen}
      onClose={() => setSignModalOpen(false)}
      signRecords={signRecords}
    />
  );
}
```

- [ ] **Step 5: 添加 VipSignModal import**

在顶部 import 末尾添加：

```typescript
import { VipSignModal } from "@/components/VipSign/VipSignModal";
```

- [ ] **Step 6: Verify and commit**

```bash
git add components/Header/ProfileMenu.tsx
git commit -m "feat(vip-sign): add VIP check-in menu item to ProfileMenu

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: VipSignModal 签到卡片组件

**Files:**

- Create: `components/VipSign/VipSignModal.tsx`
- Create: `components/VipSign/index.ts`

**Interfaces:**

- Consumes: `VipSignRecord` from `types/api/vipSign`
- Consumes: `getMusicComments({ id, limit })` from `lib/api/comment`
- Consumes: `usePlayerStore` from `@/store`
- Produces: 签到卡片 Modal
- Depends on: Task 1 (types)

- [ ] **Step 1: 创建 `components/VipSign/VipSignModal.tsx`**

```tsx
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiCalendar } from "react-icons/fi";
import { PiHeart, PiHeartFill, PiPlayCircleFill } from "react-icons/pi";
import { toast } from "sonner";
import { getMusicComments } from "@/lib/api/comment";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import { usePlayerStore } from "@/store";
import type { VipSignRecord } from "@/types/api/vipSign";

const BackgroundRender = dynamic(
  () => import("@applemusic-like-lyrics/react").then((mod) => mod.BackgroundRender),
  { ssr: false },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 日期格式化
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const WEEK_DAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const WEEK_DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDate(timeStr: string, locale: string) {
  const d = new Date(timeStr);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const wd = locale === "en-US" ? WEEK_DAYS_EN[d.getDay()] : WEEK_DAYS[d.getDay()];

  if (locale === "en-US") {
    return `${wd}, ${monthName(d)} ${day}, ${y}`;
  }
  return `${y}年${m}月${day}日 ${wd}`;
}

function monthName(d: Date) {
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][
    d.getMonth()
  ];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 连续签到天数计算
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function calcConsecutiveDays(records: VipSignRecord[]): number {
  // records 按 timeStr 升序排列，找到从今天往回连续 today: true 的记录
  let count = 0;
  for (let i = records.length - 1; i >= 0; i--) {
    if (records[i].today) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CSS Fallback Background
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function CSSFallbackBg({ coverUrl }: { coverUrl: string }) {
  return (
    <div
      className="absolute inset-0 opacity-60"
      style={{
        backgroundImage: `url(${coverUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        filter: "blur(80px) saturate(180%) brightness(0.5)",
        transform: "scale(1.5) translateZ(0)",
      }}
    />
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Props
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface VipSignModalProps {
  open: boolean;
  onClose: () => void;
  signRecords: VipSignRecord[];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function VipSignModal({ open, onClose, signRecords }: VipSignModalProps) {
  const { t, locale } = useI18n();

  // 找到今天的记录（today: true）
  const todayRecord = useMemo(() => signRecords.find((r) => r.today), [signRecords]);
  const todaySongId = todayRecord?.songId;
  const todayCover = todayRecord?.songCover ?? "";
  const consecutiveDays = useMemo(() => calcConsecutiveDays(signRecords), [signRecords]);

  // 热门评论
  const [hotComment, setHotComment] = useState<{ content: string; nickname: string } | null>(null);

  useEffect(() => {
    if (!todaySongId) return;
    getMusicComments({ id: todaySongId, limit: 1 })
      .then((res) => {
        const hot = res.data?.hotComments?.[0];
        if (hot) {
          setHotComment({
            content: hot.content,
            nickname: hot.user?.nickname ?? "",
          });
        }
      })
      .catch(() => {
        /* 静默失败，不影响卡片展示 */
      });
  }, [todaySongId]);

  // 播放当前歌曲
  const handlePlay = useCallback(() => {
    if (!todaySongId) return;
    const store = usePlayerStore.getState();
    // 如果当前队列没有这首歌，创建一个只包含此歌曲的队列
    store.playFromSong({ id: todaySongId } as any, [{ id: todaySongId }] as any);
    onClose();
  }, [todaySongId, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70" onClick={onClose} />

          {/* Card */}
          <motion.div
            className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-[#1a1a1a] shadow-2xl"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Background Layer */}
            {todayCover ? (
              <div className="pointer-events-none absolute inset-0 z-0">
                <div
                  className="absolute inset-0 scale-[1.2] opacity-60"
                  style={{ filter: "blur(24px) brightness(0.6)" }}
                >
                  <BackgroundRender
                    album={todayCover}
                    playing={false}
                    hasLyric={false}
                    renderScale={0.35}
                    staticMode
                  />
                </div>
                <div className="absolute inset-0 bg-black/20" />
              </div>
            ) : (
              <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a]" />
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 z-20 rounded-full bg-black/30 p-2 text-white/70 transition-all hover:bg-black/50 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center gap-5 p-8 text-white">
              {/* Date */}
              <div className="text-center">
                <div className="text-2xl font-bold tracking-tight">
                  {signRecords.length > 0
                    ? formatDate(signRecords.find((r) => r.today)?.timeStr ?? "", locale)
                    : formatDate(new Date().toISOString().slice(0, 10), locale)}
                </div>
                <div className="mx-auto mt-1 h-px w-16 bg-white/20" />
              </div>

              {/* Today's Song Title */}
              <div className="text-center">
                <div className="mb-1 text-xs tracking-widest text-white/50 uppercase">
                  {t("vipSign.recommendedSong")}
                </div>
              </div>

              {/* Main: Quote + Cover */}
              <div className="flex w-full items-stretch gap-4">
                {/* Left: Hot Comment Quote */}
                <div className="flex min-w-0 flex-1 flex-col justify-center rounded-xl bg-white/5 p-4 backdrop-blur-sm">
                  {hotComment ? (
                    <>
                      <div className="line-clamp-4 text-sm leading-relaxed text-white/80 italic">
                        &ldquo;{hotComment.content}&rdquo;
                      </div>
                      <div className="mt-2 text-right text-xs text-white/40">
                        &mdash; {hotComment.nickname}
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-xs text-white/30">
                      {t("common.status.loading")}
                    </div>
                  )}
                </div>

                {/* Right: Song Cover + Actions */}
                <div className="flex shrink-0 flex-col items-center gap-2">
                  <div className="h-24 w-24 overflow-hidden rounded-xl bg-black/30 shadow-lg ring-1 ring-white/10">
                    {todayCover ? (
                      <Image
                        width={96}
                        height={96}
                        src={todayCover}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-white/20">
                        <FiCalendar className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handlePlay}
                      className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                      title={t("contextMenu.play")}
                    >
                      <PiPlayCircleFill className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                      title={t("contextMenu.comments")}
                      onClick={() => {
                        if (todaySongId) {
                          window.location.href = `/comment?songId=${todaySongId}`;
                        }
                      }}
                    >
                      <PiHeart className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Consecutive Days */}
              <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-sm text-white/70">
                <FiCalendar className="h-4 w-4" />
                <span>{t("vipSign.consecutiveDays", { days: consecutiveDays })}</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: 创建 `components/VipSign/index.ts`**

```typescript
export { VipSignModal } from "./VipSignModal";
```

- [ ] **Step 3: Verify and commit**

```bash
git add components/VipSign/
git commit -m "feat(vip-sign): add VipSignModal with check-in card, quote, and playback

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: PlayerStore 音质状态

**Files:**

- Modify: `store/module/player.tsx`

**Interfaces:**

- Consumes: `MusicQuality`, `UI_QUALITY_TO_LEVEL`, `getSongUrlWithQuality` from `lib/api/music`
- Produces: `musicQuality: MusicQuality`, `setMusicQuality(q)`, `playTrack` 集成音质

- [ ] **Step 1: 在 `store/module/player.tsx` 顶部添加 import**

在文件顶部现有 import 之后添加：

```typescript
import { UI_QUALITY_TO_LEVEL, getSongUrlWithQuality } from "@/lib/api/music";
```

- [ ] **Step 2: 定义 MusicQuality 类型**

在文件开头的类型定义区域（`RepeatMode` 行之后）添加：

```typescript
export type MusicQuality = "spatial" | "lossless" | "high" | "standard";
```

- [ ] **Step 3: 在 PlayerStore 接口中添加字段和方法**

在 `playbackFailureCount: number;` 行之后添加：

```typescript
musicQuality: MusicQuality;
setMusicQuality: (quality: MusicQuality) => void;
```

- [ ] **Step 4: 在 store 实现中添加初始值和 setter**

在 `playbackFailureCount: 0,` 行之后添加：

```typescript
musicQuality: "high",
setMusicQuality: (quality) => set({ musicQuality: quality }),
```

- [ ] **Step 5: 修改 `playTrack` 方法，集成音质**

找到 `playTrack` 方法中以下代码段：

```typescript
const [urlRes, lyricRes] = await Promise.all([greySongUrlMatch(song.id), getLyric(song.id)]);
const url = urlRes.data ?? urlRes.proxyUrl;
```

替换为：

```typescript
const { musicQuality } = get();
const level = UI_QUALITY_TO_LEVEL[musicQuality] || "exhigh";

const [urlRes, lyricRes] = await Promise.all([
  getSongUrlWithQuality(song.id, level),
  getLyric(song.id),
]);
const url = urlRes.data;
```

- [ ] **Step 6: 将 `musicQuality` 加入 persist partialize**

在 `partialize` 函数中（约第 395 行），在返回对象的末尾添加：

```typescript
musicQuality: state.musicQuality,
```

- [ ] **Step 7: Verify and commit**

```bash
git add store/module/player.tsx
git commit -m "feat(player): add musicQuality state and integrate quality into playback

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 6: PlayBar 音质选择器 UI

**Files:**

- Modify: `components/PlayerBar.tsx`

**Interfaces:**

- Consumes: `musicQuality`, `setMusicQuality` from `usePlayerStore`
- Consumes: `t("playbar.quality")`, `t("playbar.qualityTitle")` from i18n

- [ ] **Step 1: 在 `components/PlayerBar.tsx` 顶部添加图标和 shadcn import**

在 `lucide-react` import 中添加 `CircleDot, Radio, RadioReceiver, Sparkles`：

```typescript
import {
  ChevronDown,
  ChevronUp,
  CircleDot,
  Expand,
  Mic2,
  MinimizeIcon,
  MonitorSpeaker,
  Pause,
  Play,
  Radio,
  RadioReceiver,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Sparkles,
} from "lucide-react";
```

添加 DropdownMenu 组件 import（在现有 import 区域添加）：

```typescript
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
```

- [ ] **Step 2: 在组件函数体内添加音质状态**

在 `const isLyricModalBar = variant === "lyric-modal";` 行之后添加：

```typescript
const musicQuality = usePlayerStore((s) => s.musicQuality);
const setMusicQuality = usePlayerStore((s) => s.setMusicQuality);
```

- [ ] **Step 3: 添加音质选项配置常量**

在 `PlayerBar` 组件外部（`export const PlayerBar` 之前）添加或在组件内部 const 定义中添加：

```typescript
const QUALITY_OPTIONS = [
  {
    value: "spatial" as const,
    icon: Sparkles,
    label: "高清臻音",
    sublabel: "96kHz/24bit",
    description: "高频细节还原与清晰沉浸感",
  },
  {
    value: "lossless" as const,
    icon: Radio,
    label: "无损 (SQ)",
    sublabel: "最高48kHz/16bit",
    description: "高保真无损音质",
  },
  {
    value: "high" as const,
    icon: RadioReceiver,
    label: "极高 (HQ)",
    sublabel: "最高320kbps",
    description: "近CD音质的细节体验",
  },
  {
    value: "standard" as const,
    icon: CircleDot,
    label: "标准",
    sublabel: "128kbps",
    description: "标准音质",
  },
];
```

- [ ] **Step 4: 在 JSX 右侧按钮区添加音质选择器**

在 `Mic2`（歌词）按钮与 `<div className="hidden md:block">`（队列）之间添加：

```tsx
{
  /* 音质选择 */
}
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <button
      type="button"
      className="flex items-center justify-center transition-colors hover:text-white"
      title={t("playbar.quality")}
    >
      <Radio className="h-4 w-4 lg:h-5 lg:w-5" />
    </button>
  </DropdownMenuTrigger>
  <DropdownMenuContent
    className="w-64 rounded-xl border-white/10 bg-[#282828] p-2 text-white"
    side="top"
    align="end"
    sideOffset={8}
  >
    <DropdownMenuLabel className="px-2 py-1 text-xs font-normal text-zinc-400">
      {t("playbar.qualityTitle")}
    </DropdownMenuLabel>
    <DropdownMenuSeparator className="bg-white/10" />
    <DropdownMenuRadioGroup value={musicQuality} onValueChange={(v) => setMusicQuality(v as any)}>
      {QUALITY_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        return (
          <DropdownMenuRadioItem
            key={opt.value}
            value={opt.value}
            className="rounded-lg px-3 py-2.5 text-[15px] focus:bg-white/10 focus:text-white"
          >
            <div className="flex min-w-0 items-center gap-3">
              <Icon className="h-5 w-5 shrink-0 text-zinc-300" />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-white">{opt.label}</div>
                <div className="mt-0.5 truncate text-[11px] text-zinc-400">
                  {opt.sublabel} · {opt.description}
                </div>
              </div>
            </div>
          </DropdownMenuRadioItem>
        );
      })}
    </DropdownMenuRadioGroup>
  </DropdownMenuContent>
</DropdownMenu>;
```

- [ ] **Step 5: Verify and commit**

```bash
git add components/PlayerBar.tsx
git commit -m "feat(playbar): add audio quality selector dropdown with 4 levels

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## 自检清单

- [x] **Spec coverage:** 所有 spec 需求都有对应 task（Task 1 覆盖 API+类型，Task 2 覆盖 i18n，Task 3 覆盖 ProfileMenu，Task 4 覆盖 VipSignModal，Task 5 覆盖 PlayerStore 状态，Task 6 覆盖 PlayBar UI）
- [x] **Placeholder scan:** 无 TODO/TBD，每步都有完整代码
- [x] **Type consistency:** `MusicQuality` 类型（spatial/lossless/high/standard）在 Task 5 定义，Task 6 消费；`VipSignRecord` 在 Task 1 定义，Task 3-4 消费；`UI_QUALITY_TO_LEVEL` 在 `lib/api/music.ts` 已存在，Task 5 引用

---

## 执行方式

**Plan complete and saved to `docs/superpowers/plans/2026-07-02-vip-sign-and-quality-selector.md`.**

Two execution options:

1. **Subagent-Driven (recommended)** — 我派发独立 subagent 按 Task 依次执行，每完成一个 Task 后 review
2. **Inline Execution** — 在当前会话中按顺序执行所有 Task，以 checkpoints 分段 review

**你倾向哪种方式？**
