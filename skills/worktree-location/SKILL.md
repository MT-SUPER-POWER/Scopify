---
name: worktree-location
description: 创建 Scopify 的 Git worktree 时使用。所有 Agent 都把新工作树放在仓库根目录的 .worktrees/ 下。
---

# Scopify 工作树位置

先用 `git worktree list --porcelain` 确认主工作树根目录。即使当前在另一个工作树里，也从主工作树定位 `.worktrees/`。

所有 Agent（包括子 Agent）都在 `<仓库根目录>/.worktrees/<任务名>/` 下创建工作树。例如，从主工作树运行 `git worktree add .worktrees/<任务名> <分支>`。已有工作树按原路径使用，除非用户要求迁移。
