---
name: codegraph-usage
description: >
  当需要定位符号、理解调用链、追踪跨文件依赖、或回答"这个函数/类在哪里/被谁调用"时触发。
  在有 .codegraph/ 索引的项目中，优先于 grep/find/逐文件阅读。
---

# CodeGraph 使用规范

## 索引生命周期

### 检查是否已有索引

项目根目录存在 `.codegraph/` 目录即代表已建立索引，可直接查询。

### 初次建立索引

```bash
codegraph index
```

### 写完代码后同步

每次完成代码修改，执行同步以保持索引与实际代码一致：

```bash
codegraph sync
```

建议收尾习惯：改完代码 → 验证 → `codegraph sync` → commit。

---

## 何时使用 CodeGraph

**经验法则：需要跨 2 个以上文件才能回答的问题，先 codegraph。**

适合的场景：
- 找函数/类/变量的定义位置
- 了解某个符号被哪些地方调用
- 追踪完整调用链（含动态派发、接口实现）
- 理解模块间依赖关系
- 搞清楚跨进程/跨包的通信路径

不适合的场景（改用 grep）：
- 搜索字面字符串（日志文本、注释、魔法字符串）
- 搜索配置键名、环境变量名
- 正则匹配文件内容

---

## 工具使用方式

### 方式一：MCP 工具（推荐）

通过 `codegraph_explore` MCP 工具调用，传入自然语言或符号名查询。  
一次调用即可返回：相关符号的逐字源码（带行号）+ 符号间调用路径。

### 方式二：Shell

```bash
codegraph explore "<符号名或问题描述>"
```

---

## 查询技巧

- **定位符号**：直接写符号名，如 `"MyService.handleRequest"`
- **理解用途**：加 `usages` 或 `callers`，如 `"AuthMiddleware usages"`
- **追踪链路**：描述链路两端，如 `"from LoginController to TokenStore"`
- **文件导向**：加文件名限定，如 `"request.ts base URL config"`
- **deferred 符号**：输出中标记为 deferred 时，用该符号名单独再查一次

---

## 解读输出

CodeGraph 返回两类核心信息：

1. **符号源码**：带行号的逐字源码，可直接用于精准定位和编辑
2. **调用路径**：从调用方到被调用方的完整路径，包含接口动态派发跳转（grep 无法追踪）

> CodeGraph 是索引快照，可能轻微落后于最新代码。用 `view_file` 核对行号后再编辑，提交前以文件实际内容为准。

---

## 与其他工具分工

| 需求 | 工具 |
|------|------|
| 定位符号、理解调用链 | **codegraph_explore**（首选） |
| 搜索字面字符串 | `grep_search` |
| 读单个文件完整内容 | `view_file` |
| 列目录结构 | `list_dir` |
| 执行命令/构建/测试 | `run_command` |

---

## 禁止行为

- 有 `.codegraph/` 的项目中，不可用 `grep_search` 做符号定位作为第一步
- 不可连续打开 5+ 个文件"读懂"调用链，而不先用 codegraph
- 不可把 CodeGraph 输出直接作为最终依据提交代码，必须与实际文件核对