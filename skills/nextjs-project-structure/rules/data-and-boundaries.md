# 数据请求与边界

> 回答：数据怎么请求，加载中和失败怎么处理，影响范围怎么控制。路由怎么拆见 [项目结构与拆分原理](./architecture.md)，组件放哪见 [组件规则](./components.md)。

两件事分开想：**Query 管请求状态，React 边界决定失败影响范围。** 先按可独立恢复的业务区域划边界，再在边界里放 Query。

## 请求封装三层

```text
lib/api/              只发请求的纯函数
types/<领域>/api.ts   请求与响应的类型
hooks/<领域>/         TanStack Query：缓存、状态、副作用
```

| 层 | 职责 | 不能有 |
| --- | --- | --- |
| `lib/api/` | 封装 HTTP 请求，声明预期业务码，失败继续 reject | 状态、UI、业务判断、`interface` 定义、吞错 |
| `types/<领域>/api.ts` | 请求与响应类型 | 状态、逻辑 |
| `hooks/<领域>/` | Query key、请求条件、缓存策略、错误抛出策略 | UI、跨独立区域汇总 `isError` / `isFetching` |

```ts
// lib/api/comment.ts：薄封装，只发请求
export function getMVComments(params: MusicCommentParams, signal?: AbortSignal) {
  return request.get<SongComment>("/comment/mv", { params, signal });
}

// hooks/comment/useCommentHeader.ts：Query 在这里
export function useCommentHeader(resource: CommentResource) {
  return useSuspenseQuery({
    queryKey: musicQueryKeys.comment.header(resource.kind, resource.id),
    queryFn: () => getCommentResourceHeader(resource.kind, resource.id),
    staleTime: 5 * 60_000,
  });
}
```

- `lib/web/` 提供 request、`ApiError` 分类、会话失效处理和日志基础设施，复用它们，不要另建一套。
- 数据转换（裁剪、映射）放业务纯函数，不放在组件或 api 层。

### 什么时候用 Query

| 场景 | 用 Query | 原因 |
| --- | --- | --- |
| 需要缓存、跨组件共享、自动刷新 | 是 | 单一数据源 |
| 要加载/错误状态 | 是 | 内置状态 |
| 高频本地操作（播放、音量） | 否 | 用 Zustand |
| 一次性操作（收藏、点赞） | 视情况 | 有副作用用 mutation |
| 表单提交 | 否 | 用 React Hook Form |

## 选边界

| 边界 | 示例 | 恢复范围 |
| --- | --- | --- |
| 应用兜底 | 根布局、初始化、未预期运行时异常 | 应用级错误页 |
| 页面主内容 | 歌单、专辑、MV 主详情 | 页面内容区；保留应用外壳和播放栏 |
| 独立栏目 | 首页推荐、排行榜、相似 MV、评论 | 对应栏目 |
| 分页 | 下一页、加载更多 | 列表尾部；保留已加载数据 |
| 用户操作 | 收藏、点赞、发表评论 | 操作附近反馈，必要时回滚 |
| 媒体 | 播放地址请求、video/audio 加载失败 | 播放器内部；保留详情与评论 |

- 必须一起成功才能使用的请求共用一个边界；能独立使用的内容拆开。
- 不要按请求个数机械拆，也不要给每张卡片加无意义的边界。
- **独立栏目就是 `@slot` 的标尺**：能单独失败、单独重试的区域，对应一个 slot。

## 在组件里怎么建立边界

复用统一的 `QueryBoundary`（`components/shared/QueryBoundary`），不要自己写错误边界与重试状态机。

```tsx
// 区域入口：边界在外，Query 在里面的子组件
<QueryBoundary resetKey={`comment:thread:${resource.kind}:${resource.id}`} compact>
  <CommentSection resource={resource} />
</QueryBoundary>
```

- **Query 必须在边界的子组件中调用。**父组件已经调用 Query 后再给下面的展示组件套边界，接不住父组件抛出的错误。
- `resetKey` 带上资源身份（页面 ID、账号、搜索词、Tab）。身份变化时边界重建，不会沿用旧资源的错误。不要用每次渲染都新建的对象当 `resetKey`。
- 每个独立恢复区域组合 `QueryErrorResetBoundary` 和 React 错误边界，重试同时恢复两者；`QueryBoundary` 已经封装好。

## 状态协议

1. **首次无数据且请求中：**显示该区域骨架屏。
2. **首次无数据且请求失败：**抛给最近的边界（`throwOnError`，用统一的「无数据才抛出」策略）。
3. **已有缓存数据，后台刷新中或刷新失败：**保持内容，不切回骨架或错误页。是否有数据以 `data !== undefined` 判断，不以数组长度判断。
4. **成功返回空数组或合法空结果：**显示业务空状态，不视为错误。数据形状损坏不能当作合法空结果。
5. **离线等待（`fetchStatus` 为 paused）、请求取消、`enabled=false`：**不伪造网络错误，也不一直显示「正在联网」。
6. **加载更多失败：**保留已有列表，在尾部重试该页；首次加载失败交给区域边界。
7. **Mutation 默认不抛给页面边界：**反馈归所属操作，乐观更新需要回滚。收藏状态未获取时保持「未知 / 不可操作」，不能显示成未收藏。
8. **媒体错误：**通过元素事件进入播放器本地状态；普通 React 错误边界接不住 `video` / `audio` 的事件失败。

## 错误怎么分类处理

- 网络、超时、后端服务失败：区域网络重试组件。
- 已知资源不存在、无权限：业务状态，不要全部写成网络错误。
- 会话失效：现有的集中登录处理，不要重复弹窗。
- 程序异常、未知错误：未预期错误组件与诊断记录，不要伪装成网络失败。
- `QueryCache.onError` / `MutationCache.onError` 负责统一记录，不决定页面怎么展示。避免请求层、Query 层、边界和业务组件重复弹出同一个错误。

## slot 与 Suspense

slot 区域优先用 Suspense：单一请求、无条件的读取用 `useSuspenseQuery`，骨架屏写在该 slot 的 `loading.tsx`，失败仍进 `QueryBoundary`。

以下情况保留 `useQuery`，在区域内按「首次无数据且请求中」渲染骨架屏，不写 `loading.tsx`：

| 情况 | 原因 | 做法 |
| --- | --- | --- |
| 条件请求（依赖登录等 `enabled`） | `useSuspenseQuery` 不支持 `enabled` | 登录判断放在 Suspense 之外的门控组件，未登录返回 `null`；门控内再用 Suspense Query |
| 有备用数据源（`selectFallbackSource`） | Suspense Query 出错就抛，无法表达「一个失败用另一个」 | 保留 `useQuery` |
| 需要展示「离线等待」 | Suspense 会一直停在骨架屏 | 保留 `useQuery` |

- 桌面构建（静态导出）的预渲染阶段不得触发真实请求。首个迁移到 Suspense Query 的 slot 先验证桌面构建结果，再推广。
- 同一边界里有多个 Suspense 查询时，注意请求瀑布和并行策略。
- 非 slot 区域不强制迁移 Suspense，普通 `useQuery` 加 `throwOnError` 已能接入。

## 新增一个数据区域

1. 在 `lib/api/` 加请求函数，类型放 `types/<领域>/api.ts`。
2. 在 `hooks/<领域>/` 加 Query hook：单一无条件请求用 `useSuspenseQuery`，其余用 `useQuery` 加统一的错误抛出策略。
3. 区域入口（slot 的 `page.tsx` 或 `page.tsx`）放 `QueryBoundary`，`resetKey` 带资源身份。
4. 骨架屏：Suspense 区域写 `loading.tsx`；其他区域在区域内按首次无数据渲染。
5. 分页、操作、媒体错误在各自区域处理，不升级为整页失败。

## 禁止

- 用 `queryA.isError || queryB.isError` 把独立区域合成整页失败。
- catch 后返回 `[]`、`null`、默认收藏状态来伪装成功。
- 用后台 `isFetching` 抹掉现有内容。
- 把分页、收藏、评论或播放失败升级成整页不可用。
- 新增页面专用的失败栏目清单、全局 refetch 聚合器，或复制一套错误重试状态机。

迁移进度记录在 [query-boundary-migration](../../../docs/architecture/query-boundary-migration.md)，该文件只记进度，不定义约束。官方参考：[错误传播与缓存](https://tanstack.com/query/latest/docs/framework/react/guides/suspense#throwonerror-default)、[边界恢复范例](https://tanstack.com/query/latest/docs/framework/react/guides/suspense#resetting-error-boundaries)。
