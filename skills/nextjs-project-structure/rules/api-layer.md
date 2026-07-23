# API、类型与数据获取层规范

> 定义 `/lib/api/`、`/types/api/`、`/hooks/` 三层架构的职责边界与协作模式。

---

## 三层架构

```
lib/api/        → 薄封装层：纯函数，只负责发请求
types/api/      → 类型层：定义请求/响应的 TypeScript 接口
hooks/          → 数据管理层：TanStack Query 封装，处理缓存/状态/副作用
```

---

## 职责边界

| 层级         | 职责                     | 包含状态？ | 包含 UI 逻辑？ |
| ------------ | ------------------------ | ---------- | -------------- |
| `lib/api/`   | HTTP 请求封装            | ❌         | ❌             |
| `types/api/` | 类型定义                 | ❌         | ❌             |
| `hooks/`     | 数据获取、缓存、状态同步 | ✅         | ❌             |

---

## lib/api/ 规范

### 文件结构

```
lib/api/
├── user.ts           # 用户相关 API
├── playlist.ts       # 歌单相关 API
├── track.ts          # 播放相关 API
├── comment.ts        # 评论相关 API
└── ...
```

### 编写规范

```ts
// ✅ 正确：薄封装，只负责发请求
import request from "@/lib/web/request";
import type { VipSignResponse, VipSignInfoResponse } from "@/types/api/vipSign";

/** 签到 POST /vip/sign */
export function vipSign(cookie?: string) {
  return request.post<VipSignResponse>(
    "/vip/sign",
    {},
    {
      params: { cookie },
      noRetry: true,
    },
  );
}

/** 签到信息 GET /vip/sign/info */
export function vipSignInfo(cookie?: string) {
  return request.get<VipSignInfoResponse>("/vip/sign/info", {
    params: { cookie },
    noRetry: true,
  });
}
```

```ts
// ❌ 错误：在 api 层包含业务逻辑
export async function doVipSign() {
  const cookie = getCookie(); // ← 不应在 api 层
  const res = await request.post("/vip/sign", { cookie });
  if (res.code === 200) {
    toast.success("签到成功"); // ← 不应在 api 层
  }
  return res;
}
```

---

## types/api/ 规范

### 文件结构

```
types/api/
├── user.ts           # 用户相关类型
├── playlist.ts       # 歌单相关类型
├── vipSign.ts        # 签到相关类型
├── music.ts          # 音乐相关类型
└── index.ts          # 统一导出
```

### 编写规范

```ts
// ✅ 正确：按领域组织，接口命名清晰
export interface VipSignSongInfo {
  songId: number;
  songName: string;
  artistName: string;
  album: string;
  cover: string;
  artistIds: number[];
}

export interface VipSignDetail {
  recordId: number;
  userId: number;
  time: number;
  today?: boolean;
  songInfo?: VipSignSongInfo;
  monthCheckInTotalDay?: number;
  monthCheckInPrizList?: VipSignPrize[];
}

export interface VipSignInfoResponse {
  code: number;
  data: VipSignDetail[];
  message: string;
}
```

```ts
// ❌ 错误：类型散落在组件中
// components/Header/ProfileMenu.tsx
interface SignRecord {
  // ← 不应在组件中定义
  recordId: number;
  // ...
}
```

---

## hooks/ 规范

### 文件结构

```
hooks/
├── vipSign/
│   └── useVipSign.ts      # TanStack Query Hook
├── album/
│   ├── useAlbumData.ts     # 数据获取
│   └── useAlbumQuery.ts    # 查询配置
└── ...
```

### 编写规范

```ts
// ✅ 正确：TanStack Query Hook
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vipSign, vipSignInfo } from "@/lib/api/user";
import type { VipSignInfoResponse, VipSignResponse } from "@/types/api/vipSign";

// Query Key 工厂
export const vipSignKeys = {
  all: ["vipSign"] as const,
  info: () => [...vipSignKeys.all, "info"] as const,
};

export function useVipSign() {
  const queryClient = useQueryClient();

  // 查询签到信息
  const { data, isLoading } = useQuery<VipSignInfoResponse>({
    queryKey: vipSignKeys.info(),
    queryFn: async () => {
      const cookie = localStorage.getItem("music_cookie") ?? undefined;
      const res = await vipSignInfo(cookie);
      return res.data;
    },
    staleTime: 2 * 60 * 1000, // 2 分钟缓存
    refetchOnWindowFocus: true, // 窗口获焦刷新
  });

  // 签到 mutation
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async () => {
      const cookie = localStorage.getItem("music_cookie") ?? undefined;
      const res = await vipSign(cookie);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vipSignKeys.info() });
    },
  });

  return {
    signRecords: data?.data ?? [],
    hasSignedToday: data?.data?.some((r) => r.today) ?? false,
    isLoading,
    isSigning: isPending,
    doSign: mutateAsync,
  };
}
```

```ts
// ❌ 错误：直接在组件中管理状态
const [records, setRecords] = useState([]);
const [signed, setSigned] = useState(false);

useEffect(() => {
  vipSignInfo().then((res) => {
    setRecords(res.data);
    setSigned(res.data.some((r) => r.today));
  });
}, []);
```

---

## 数据流示意图

```
┌─────────────────────────────────────────────────────────────┐
│                         Component                           │
│  ProfileMenu / VipSignModal                                 │
│  ├─ 调用 useVipSign()                                       │
│  └─ 使用返回的 { signRecords, hasSignedToday, doSign }       │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     hooks/vipSign/useVipSign                 │
│  ├─ useQuery(vipSignKeys.info(), fetchFn)                   │
│  ├─ useMutation(signFn)                                     │
│  └─ 自动管理缓存、加载状态、错误处理                          │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     lib/api/user.ts                          │
│  ├─ vipSign() → request.post("/vip/sign")                   │
│  └─ vipSignInfo() → request.get("/vip/sign/info")           │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     lib/web/request                          │
│  └─ Axios 实例，处理 HTTP 请求                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 何时使用 TanStack Query

| 场景                      | 使用 Query？ | 原因                   |
| ------------------------- | ------------ | ---------------------- |
| 需要缓存的数据            | ✅           | 避免重复请求           |
| 跨组件共享数据            | ✅           | 单一数据源             |
| 需要自动刷新              | ✅           | refetchOnWindowFocus   |
| 加载/错误状态管理         | ✅           | 内置 isLoading/error   |
| 高频本地操作（播放/音量） | ❌           | Zustand 更合适         |
| 一次性操作（收藏/点赞）   | 视情况       | 有副作用用 mutation    |
| 表单提交                  | ❌           | React Hook Form 更合适 |

---

## 错误处理模式

```ts
// Hook 层统一处理错误
const { mutateAsync } = useMutation({
  mutationFn: signApi,
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: signKeys.info() });
    if (data.code === 200) {
      toast.success("签到成功");
    } else {
      toast.error(data.message);
    }
  },
  onError: (error: any) => {
    const msg = error?.businessMsg || error?.message || "";
    if (msg.includes("已经")) {
      toast.info("今日已签到");
    } else {
      toast.error(msg);
    }
  },
});
```
