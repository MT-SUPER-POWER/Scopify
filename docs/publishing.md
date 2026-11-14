# Desktop 发布管理

桌面安装包发布由 `.github/workflows/publish.yml` 统一管理； `.github/workflows/release.yml` 是其调用的构建与发布流程。不需要手动修改 package.json 或 CHANGELOG，版本仍以 tag 为准。

## 发布通道

| 通道 | 来源分支 | Tag 示例 | GitHub Release | 版本与 CHANGELOG 回写 |
| --- | --- | --- | --- | --- |
| 正式版 | `master` | `v3.5.0` | 正式发布 | 回写 `master` |
| Beta | `beta` | `v3.5.0-beta.1` | Prerelease，不设为 Latest | 不回写 |

普通分支推送只运行质量 CI，不自动发布。Beta 沿用现有应用身份和安装目录，不是一个可以与正式版独立安装的应用；客户端的更新通道由“设置 → 客户端更新 → 接收 Beta 更新”控制，默认关闭。

发版前先获取远端标签，再在对应分支用 `pnpm bump <级别> --dry-run` 预览下一版。预览只打印标签；正式发布仍以标签为准。Beta 发布不回写版本文件，所以 Beta 预览会读取当前分支历史中的最新 Beta 标签。

| 命令 | 从 `v3.4.4` 开始 | 从 `v4.0.0-beta.2` 开始 |
| --- | --- | --- |
| `pnpm bump patch --dry-run` | `v3.4.5` | `v4.0.1-beta.1` |
| `pnpm bump minor --dry-run` | `v3.5.0` | `v4.1.0-beta.1` |
| `pnpm bump major --dry-run` | `v4.0.0` | `v5.0.0-beta.1` |
| `pnpm bump beta --dry-run` | `v3.4.4-beta.1` | `v4.0.0-beta.3` |

## 方式一：手动发布

1. 将需要发布的代码及 workflow 推送到对应分支。
2. 在 GitHub Actions 打开 **Publish Desktop**，选择 **Run workflow**。
3. 正式版选择 `master`，Beta 选择 `beta`；输入对应的完整 tag。
4. 发布管理会校验版本格式、分支、已有 tag 和已有 Release，再创建 tag 并直接调用构建流程。

`workflow_dispatch` 的入口需要先存在于默认分支 `master`。因此新 workflow 首次落地后，在它合入默认分支之前，使用下面的 tag 方式触发。

手动发布使用当前 workflow run 锁定的提交；运行期间分支的新提交不会混入安装包。同一个 tag 的发布串行执行，不会自动取消正在构建的发布。

管理流程创建 tag 使用 `GITHUB_TOKEN`，不会依赖这个 tag 再触发第二次 workflow。它会在同一次 run 内调用可复用构建流程，避免重复发布，也不要求额外 PAT。

## 方式二：推送 tag

Beta 示例（版本号仅为示例，按实际待发布版本填写）：

```bash
git switch beta
git tag v3.5.0-beta.1
git push origin beta
git push origin v3.5.0-beta.1
```

正式版在 `master` 上使用不含 `-beta.N` 的 tag。版本各段以及 Beta 序号不允许前导零。发布提交必须包含在对应远端分支历史中；Beta 独有提交不能发成正式版。

## 构建与失败恢复

- Renderer 只构建一次，Windows/macOS 从同一锁定提交打包并校验产物。
- Beta 发布不会执行正式版的版本和 CHANGELOG 回写任务。
- 发布前再次核对远端 tag 对应提交，不允许自动移动或覆盖 tag。
- tag 已创建但构建失败时，在原 Actions run 选择 **Re-run all jobs**；已有 tag 必须仍指向同一提交。
- 需要修改代码后再发布时，使用新的 Beta 序号，不移动旧 tag。
- 如果 GitHub Release 已存在（含草稿），发布管理会拒绝重复发布；遇到 API 或权限错误也会停止。
- 如果上传过程中只产生了部分 Release 文件，先人工检查和处理该 Release，不自动删除或覆盖。

## 应用内 Beta 更新

桌面客户端默认使用 Desktop 的 `package.json` 中声明的 GitHub 仓库。要测试 fork 的更新，在启动桌面进程前设置 `SCOPIFY_UPDATE_REPOSITORY=owner/repo`。发布列表、安装包和 macOS 手动下载链接都使用该仓库。GitHub Actions 发包仍使用触发工作流的仓库。

在“设置 → 客户端更新”开启“接收 Beta 更新”，保存设置后点击检查更新。开关默认关闭，旧配置缺少该字段时同样按关闭处理。开启后检查 Beta 和正式发布，Windows 沿用下载与安装流程，macOS 沿用前往对应 Release 页面手动安装的流程。

更新器在包含当前平台更新文件的已发布版本中，按 SemVer 选择最高版本，与发布时间无关。开关关闭时只选正式版；开启时将正式版和 Beta 一起比较。只有比已安装版本更高的候选才会更新。

| 已发布版本 | 开启 Beta 时选择 |
| --- | --- |
| `v4.0.1-beta.2` 和 `v4.0.1` | `v4.0.1`，同一组版本号的正式版更高 |
| `v4.0.1` 和 `v4.0.2-beta.1` | `v4.0.2-beta.1`，patch 更高 |
| `v4.0.2-beta.9` 和 `v4.0.2-beta.10` | `v4.0.2-beta.10`，Beta 序号按数字比较 |

关闭开关会取消进行中的旧通道下载，清除旧更新提示，并禁止旧安装包退出时自动安装。检查或下载期间保存通道变化时，旧请求结束后会按新通道重新检查，忽略旧通道的迟到事件。关闭不会卸载当前 Beta，也不会自动降级到较旧的稳定版；后续只接收更高版本的稳定版。更新设置仍沿用页面已有的保存机制，不会仅因编辑尚未保存的开关而改变更新器行为。

相关机制：[GitHub 可复用 workflow](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows)、 [GITHUB_TOKEN 触发规则](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow)。
