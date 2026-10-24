# 版本管理指南 (Versioning Guide)

Scopify 采用 Monorepo 架构，应用端与主工程由 4 个核心 `package.json` 协同构成。为了避免手动逐个修改版本号带来的繁琐和遗漏，项目提供了统一的版本升级脚本 `scripts/bump-version.ts`。

---

## 快速使用

在工程根目录下执行以下命令即可：

```bash
# 1. 默认自增 Patch 版本（最常用，如 2.0.3 -> 2.0.4）
pnpm bump

# 2. 语义化自增
pnpm bump patch   # 2.0.3 -> 2.0.4
pnpm bump minor   # 2.0.3 -> 2.1.0
pnpm bump major   # 2.0.3 -> 3.0.0

# 3. 指定确切版本号（支持带或不带 'v'，支持预发布后缀）
pnpm bump 2.0.5
pnpm bump v2.0.5
pnpm bump 2.1.0-beta.1
```

---

## 统一同步的目标文件

执行 `pnpm bump` 时，脚本会自动同步以下 4 个应用级配置文件中的 `"version"` 字段：

1. [根目录 package.json](file:///d:/Github/Scopify/package.json)
2. [Web 客户端](file:///d:/Github/Scopify/repo/frontend/apps/web/package.json) (`@scopify/web`)
3. [桌面端 Electron 宿主](file:///d:/Github/Scopify/repo/frontend/apps/desktop/package.json) (`@scopify/desktop`)
4. [文档站](file:///d:/Github/Scopify/repo/frontend/apps/docs/package.json) (`@scopify/docs`)

_内部共享包（如 `@scopify/desktop-contract`、`@scopify/ui` 等）在应用中使用 `workspace:*` 引用，无需频繁变动版本。_

---

## 脚本特性

- **排版无损**：通过精准正则仅替换 `"version"` 键值，完整保留各 `package.json` 原有的缩进、换行与字段排序，避免 `JSON.stringify` 带来的无意义 git diff。
- **合法性校验**：内置 SemVer 规范检查，输入非法版本号（如 `2.0` 或无效字符）时会立即拦截并提示。
- **与 CI 发布解耦与协同**：
  - **本地日常开发**：通过 `pnpm bump` 随心升级版本。
  - **正式发版（Release CI）**：直接推送 Git Tag（如 `git tag v2.0.4 && git push origin v2.0.4`），CI 工作流会自动打包并把版本回写到仓库。

---

## 更新说明与发布预览 (Changelog Preview)

项目的更新日志（[docs/CHANGELOG.md](CHANGELOG.md)）由 `git-cliff` 基于提交历史自动生成，无需手写。

### 提交类型与展示规则

| 提交前缀 | 展示分组 | 说明 |
| :-- | :-- | :-- |
| `feat:` / `feat(...):` | **新增** | 面向用户的新功能（如 `feat(player): 支持歌词双语对照`） |
| `fix:` / `fix(...):` | **修复** | 面向用户的缺陷修复（如 `fix(desktop): 修复外链弹出窗口问题`） |
| `perf:` / `perf(...):` | **优化** | 性能提升与体验优化 |
| `chore:`, `docs:`, `ci:` 等 | *不展示* | 仅用于工程内部维护，自动过滤 |

> **提示**：建议将用户能感知的改动用简洁明了的话写在 commit 第一行（subject），工程实现细节放在 commit body。

### 发版前随时预览

在本地完成若干个 `feat` 或 `fix` 提交后，发版前可随时在终端运行：

```bash
pnpm run changelog:preview
```

即可直接查看下个版本即将生成的更新说明。
