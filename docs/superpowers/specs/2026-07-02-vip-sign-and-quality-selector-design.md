# 网易乐签 + 音质选择器 功能设计

## 概述

本文档定义两个功能的实现规格：
1. **网易乐签 (VIP Sign)** — 在 ProfileMenu 中添加网易云黑胶会员签到功能，签到后展示卡片式签到结果
2. **音质选择器 (Quality Selector)** — 在 PlayBar 中添加音质级别选择下拉菜单

---

## 1. 网易乐签

### 1.1 架构

```
ProfileMenu.tsx
  └─ "网易乐签" DropdownMenuItem ──点击──→ vipSign(cookie)
                                              │
                                              ▼
                                         成功? ──否──→ Toast 错误
                                              │
                                              ▼ 是
                                        vipSignInfo(cookie)
                                              │
                                              ▼
                                        VipSignModal 打开
                                              │
                                    ┌─────────┼─────────┐
                                    ▼         ▼         ▼
                               日期/天数   歌曲推荐   Quote评论
                               信息展示    封面+操作   展示
```

### 1.2 API 层 — `lib/api/user.ts`

```typescript
// 网易乐签 - VIP签到
export function vipSign(cookie?: string) {
  return request.post("/vip/sign", {}, {
    params: { cookie },
    noRetry: true,
  } as any);
}

// 网易乐签 - 签到信息
export function vipSignInfo(cookie?: string) {
  return request.get("/vip/sign/info", {
    params: { cookie },
    noRetry: true,
  } as any);
}
```

**注意**：cookie 从 `localStorage.getItem("music_cookie")` 获取，通过 params 传递给后端。

### 1.3 后端路由

后端已有对应模块：
- `backend/api-enhanced/module/(vip)/vip_sign.js` → `/vip/sign`
- `backend/api-enhanced/module/(vip)/vip_sign_info.js` → `/vip/sign/info`

### 1.4 UI 层

#### ProfileMenu.tsx 修改

在 `{isLoggedIn && ...}` 区块内，"个人信息"菜单项后面新增一个菜单项：

```tsx
{isLoggedIn && (
  <>
    <DropdownMenuItem asChild className="rounded-lg px-3 py-2 text-[15px]">
      <Link href={`/profile?userId=${userId}`}>
        <FiUser className="mr-2 h-5 w-5" />
        <span>{t("profile.menu.profile")}</span>
      </Link>
    </DropdownMenuItem>

    {/* NEW: 网易乐签 */}
    <DropdownMenuItem
      onSelect={handleVipSign}
      className="rounded-lg px-3 py-2 text-[15px]"
    >
      <FiCalendar className="mr-2 h-5 w-5" />
      <span>{t("profile.menu.vipSign")}</span>
    </DropdownMenuItem>
  </>
)}
```

**点击行为** `handleVipSign`：
1. 从 localStorage 获取 cookie
2. 请求 `vipSign(cookie)`
3. 若失败 → Toast 展示错误信息（非会员 / 其他错误）
4. 若成功 → 请求 `vipSignInfo(cookie)`
5. 获取数据后 → 打开 `VipSignModal`

#### VipSignModal 组件

**位置**: `components/VipSign/VipSignModal.tsx`

**接口**:
```typescript
interface VipSignModalProps {
  open: boolean;
  onClose: () => void;
  signInfo: VipSignInfoData[];
}
```

**卡片布局** (从顶部到底部):

```
┌──────────────────────────────────────────┐
│              ✕                     │
│  ┌────────────────────────────────────┐  │
│  │  (背景: @applemusic-like-lyrics    │  │
│  │   BackgroundRender, album songCover)│  │
│  │                                    │  │
│  │  2026年7月2日 周三                  │  │
│  │  ──────────────────────────        │  │
│  │                                    │  │
│  │  今日推荐                           │  │
│  │  歌名 — 歌手名                      │  │
│  │                                    │  │
│  │  ┌────────────┬──────────────┐    │  │
│  │  │ 热门评论    │   歌曲封面    │    │  │
│  │  │  Quote     │   (SongCover) │    │  │
│  │  │            │              │    │  │
│  │  │ "Life Work │   ▶️       ♡  │    │  │
│  │  │  Balance"  │  播放  喜欢   │    │  │
│  │  │            │              │    │  │
│  │  │  — Momo    │              │    │  │
│  │  └────────────┴──────────────┘    │  │
│  │                                    │  │
│  │  📅 连续签到 5 天                  │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

**功能点**:
1. **日期显示** — 从 `timeStr` 字段获取当日日期，格式化为 "YYYY年MM月DD日 周X"
2. **连续签到天数** — 从 `signInfo` 数组向前统计连续 `today: true` 的记录数
3. **背景效果** — 使用 `@applemusic-like-lyrics/react` 的 `BackgroundRender`，以当日推荐歌曲的 `songCover` 为图片源，复用歌词 Modal 的毛玻璃 + WebGL 效果
4. **今日推荐歌曲区域**:
   - **左侧**: 展示该歌曲最热门的评论 Quote 和评论者（调用 `getMusicComments({ id: songId, limit: 1 })` 获取热评，取第一条）
   - **右侧**: 歌曲封面（圆形/圆角）+ 播放按钮 + 喜欢按钮（参考 ArtistPage 的 ActionBar 模式）
   - **底部**: 歌曲名称 + 歌手名作为大标题
5. **播放按钮**: 点击后调用 playerStore 的播放逻辑，将当前播放替换为此歌曲
6. **喜欢按钮**: 点击跳转到该歌曲的评论区页面

#### 签到信息类型定义

在 `types/api/user.ts` 或新建 `types/api/vipSign.ts`:

```typescript
export interface VipSignRecord {
  recordId: number;
  userId: number;
  time: number;
  timeStr: string;   // "2026-07-01"
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

### 1.5 i18n 新增

zh-CN:
```
"profile.menu.vipSign": "网易乐签"
"vipSign.title": "签到"
"vipSign.alreadySigned": "今天已签到"
"vipSign.notMember": "非黑胶会员无法签到"
"vipSign.consecutiveDays": "连续签到 {{days}} 天"
"vipSign.recommendedSong": "今日推荐"
"vipSign.success": "签到成功"
"vipSign.failed": "签到失败: {{message}}"
```

zh-TW / en-US 对应翻译。

---

## 2. 音质选择器

### 2.1 架构

```
PlayerBar.tsx
  └─ 右侧操作区
       └─ 音质按钮 (新) ──点击──→ DropdownMenu (shadcn)
                                   ├─ 高清臻音 (Spatial Audio)
                                   ├─ 无损 (SQ)
                                   ├─ 极高 (HQ)
                                   └─ 标准 128kbps
                                      │
                                      ▼
                              playerStore.musicQuality 更新
                                      │
                                      ▼
                              后续请求歌曲 URL 时传入 quality 参数
```

### 2.2 API 层 — `lib/api/music.ts`

新增以下接口方法与类型定义：

```typescript
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 音质相关 API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 音质等级 (对应 /song/url/v1 的 level 参数) */
export type MusicQualityLevel =
  | "standard"   // 标准 128kbps
  | "higher"     // 较高 192kbps
  | "exhigh"     // 极高 320kbps
  | "lossless"   // 无损
  | "hires"      // Hi-Res (96kHz/24bit)
  | "jyeffect"   // 高清环绕声
  | "sky"        // 沉浸环绕声
  | "dolby"      // 杜比全景声
  | "jymaster";  // 超清母带

/** UI 音质选项 -> API level 参数映射 */
export const UI_QUALITY_TO_LEVEL: Record<string, MusicQualityLevel> = {
  standard: "standard",
  high: "exhigh",
  lossless: "lossless",
  spatial: "hires",
};

/** 获取歌曲各个音质的文件信息 */
export async function getSongMusicDetail(id: number | string) {
  return request.get("/song/music/detail", { params: { id } });
  // 返回: { br, size, vd, sr }
}

/** 获取音乐 URL - 新版 (支持音质等级) */
export async function getSongUrlV1(
  id: number | string,
  level: MusicQualityLevel = "exhigh",
  unblock: boolean = true,
) {
  return request.get("/song/url/v1", { params: { id, level, unblock } });
}

/** 音乐是否可用 */
export async function checkMusicAvailable(id: number | string, br?: number) {
  return request.get("/check/music", { params: { id, ...(br ? { br } : {}) } });
}

/**
 * 带音质选择的歌曲 URL 获取
 * 先尝试 /song/url/v1 (新音质接口)，失败后降级到 /song/url/match (灰色歌曲解灰)
 */
export async function getSongUrlWithQuality(
  id: number | string,
  level: MusicQualityLevel = "exhigh",
) {
  try {
    const res = await getSongUrlV1(id, level);
    const item = res.data?.data?.[0];
    if (item?.url) {
      return { data: item.url, level, source: "url-v1" };
    }
    throw new Error("No URL returned from v1");
  } catch {
    const fallback = await greySongUrlMatch(id);
    return { data: fallback.data ?? fallback.proxyUrl, level, source: "url-match" };
  }
}
```

### 2.3 State 管理 — `store/module/player.tsx`

新增字段：
```typescript
type MusicQuality = "spatial" | "lossless" | "high" | "standard";

// 在 PlayerStore 接口中新增
musicQuality: MusicQuality;
setMusicQuality: (quality: MusicQuality) => void;
```

初始化值：`"high"`（极高HQ），持久化到 localStorage。

同时修改 `playTrack` 方法，从 store 读取 `musicQuality` 并调用 `getSongUrlWithQuality` 替代原有 `greySongUrlMatch`。

### 2.3 UI 实现

**位置**: `PlayerBar.tsx` 右侧按钮区，在 Mic2（歌词）按钮之后，QueuePopover 之前。

**代码结构**:
```tsx
// 音质选项配置
const QUALITY_OPTIONS = [
  {
    value: "spatial",
    icon: Sparkles,       // lucide-react
    label: "高清臻音",
    sublabel: "96kHz/24bit",
    description: "高频细节还原与清晰沉浸感",
  },
  {
    value: "lossless",
    icon: Radio,          // lucide-react
    label: "无损 (SQ)",
    sublabel: "最高48kHz/16bit",
    description: "高保真无损音质",
  },
  {
    value: "high",
    icon: RadioReceiver,  // lucide-react
    label: "极高 (HQ)",
    sublabel: "最高320kbps",
    description: "近CD音质的细节体验",
  },
  {
    value: "standard",
    icon: CircleDot,      // lucide-react
    label: "标准",
    sublabel: "128kbps",
    description: "标准音质",
  },
];
```

**渲染**:
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <button type="button" className="hover:text-white transition-colors" title={t("playbar.quality")}>
      <Radio className="w-4 h-4 lg:w-5 lg:h-5" />
    </button>
  </DropdownMenuTrigger>
  <DropdownMenuContent className="bg-[#282828] border-white/10 text-white p-2 w-64" side="top" align="end">
    <DropdownMenuLabel className="text-xs text-zinc-400 px-2 py-1">
      {t("playbar.qualityTitle")}
    </DropdownMenuLabel>
    <DropdownMenuSeparator className="bg-white/10" />
    <DropdownMenuRadioGroup value={musicQuality} onValueChange={setMusicQuality}>
      {QUALITY_OPTIONS.map((opt) => (
        <DropdownMenuRadioItem
          key={opt.value}
          value={opt.value}
          className="rounded-lg px-3 py-2.5 text-[15px] focus:bg-white/10"
        >
          <div className="flex items-center gap-3 min-w-0">
            <opt.icon className="w-5 h-5 shrink-0 text-zinc-300" />
            <div className="min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {opt.label}
              </div>
              <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                {opt.sublabel} · {opt.description}
              </div>
            </div>
          </div>
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  </DropdownMenuContent>
</DropdownMenu>
```

### 2.5 与播放的集成

在 `store/module/player.tsx` 的 `playTrack` 方法中，根据当前 `musicQuality` 映射出 API level，然后调用 `getSongUrlWithQuality`：

```typescript
// playTrack 内部
const { musicQuality } = get();
const level = UI_QUALITY_TO_LEVEL[musicQuality] || "exhigh";

const [urlRes, lyricRes] = await Promise.all([
  getSongUrlWithQuality(song.id, level),
  getLyric(song.id),
]);
const url = urlRes.data;
```

### 2.6 i18n 新增

zh-CN:
```
"playbar.quality": "音质选择"
"playbar.qualityTitle": "音质级别"
```

---

## 3. 文件变更清单

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `lib/api/user.ts` | 修改 | 新增 `vipSign`、`vipSignInfo` 方法 |
| `types/api/vipSign.ts` | 新建 | VipSignRecord 类型定义 |
| `components/Header/ProfileMenu.tsx` | 修改 | 新增"网易乐签"菜单项 |
| `components/VipSign/VipSignModal.tsx` | 新建 | 签到卡片 Modal |
| `components/VipSign/SignCard.tsx` | 新建 | 签到卡片内部组件 |
| `components/PlayerBar.tsx` | 修改 | 新增音质选择按钮 + DropdownMenu |
| `store/module/player.tsx` | 修改 | 新增 `musicQuality` 字段 |
| `lib/api/music.ts` | 修改 | 新增音质类型、`getSongMusicDetail`、`getSongUrlV1`、`checkMusicAvailable`、`getSongUrlWithQuality` 方法 |
| `store/module/player.tsx` | 修改 | 新增 `musicQuality` 字段；`playTrack` 改用 `getSongUrlWithQuality` 获取 URL |
| `lib/i18n.ts` | 修改 | 新增 i18n 翻译键 |

---

## 4. 注意事项

1. **Cookie 传递**: VIP sign 接口需要 cookie 才能正确识别用户身份。前端从 localStorage 获取 `music_cookie`，通过 `params.cookie` 传递给后端。
2. **错误边界**: 非黑胶会员访问时，后端会返回业务错误码（如 250）。request 拦截器已处理此类错误并 toast 提示。
3. **背景渲染降级**: 签到卡片的 `BackgroundRender` 同歌词 Modal，有 WebGL 降级到 CSS fallback 的机制。
4. **音质持久化**: `musicQuality` 通过 zustand persist 存储到 localStorage，刷新后保持用户选择。
5. **获取热门评论**: 签到接口返回的 `songId` 可用于调用评论接口获取热门评论，在 Quote 区域展示。
