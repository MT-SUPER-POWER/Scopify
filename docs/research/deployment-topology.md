# Scopify 第二阶段部署拓扑

> 调研日期：2026-07-31
>
> 适用结构：Bun Workspaces + Turborepo；Web 位于 `frontend/apps/web`，Electron 位于 `frontend/apps/desktop`。
>
> 证据范围：仅使用 Vercel、Cloudflare、GitHub Actions 和 Turborepo 的官方文档或官方仓库。

## 结论

Scopify 应采用三条彼此独立的发布路径：

```text
GitHub repository
├─ Vercel project
│  └─ frontend/apps/web → Next.js Web deployment
├─ GitHub Actions release workflow
│  ├─ Linux: build one immutable Desktop Renderer artifact
│  ├─ Windows/macOS: verify and package that exact artifact
│  └─ Release: checksums + provenance + GitHub Release assets
└─ Cloudflare zone
   ├─ web host: authoritative DNS only → Vercel
   └─ api host: proxied DNS → WAF/rate limiting → backend origin
```

- **Vercel 是 Web 应用唯一构建与运行平台。** 不再创建 Cloudflare Pages/Workers 的 Web 构建。
- **Cloudflare 管 DNS 和独立 API 边缘安全。** Vercel Web 记录使用 DNS-only；API 主机名可启用 Cloudflare proxy、WAF 和 rate limiting。
- **GitHub Actions 是 Desktop 唯一发布编排器。** Renderer 只构建一次，作为不可变 workflow artifact 传给 Windows/macOS 打包任务；各平台不能再次构建 Renderer。

## 1. Vercel：只部署 `frontend/apps/web`

### 1.1 项目设置

在 Vercel 仅创建一个 Scopify Web 项目，并设置：

| 设置 | 值 |
| --- | --- |
| Root Directory | `frontend/apps/web` |
| Framework Preset | Next.js |
| Build Command | `cd ../../.. && bun run build:web`（已由该目录的 `vercel.json` 固化） |
| Output Directory | 留空，交给 Next.js preset |
| Include source files outside of the Root Directory | 开启 |
| Skip deployments for unaffected projects | 开启（默认能力满足时） |

Vercel 的 monorepo 模型是“每个要部署的目录对应一个 Vercel Project”，Root Directory 必须在项目设置中选择；配置文件不能代替这个 Dashboard 设置。[Vercel：Using Monorepos](https://vercel.com/docs/monorepos)

必须允许构建读取 Root Directory 外的源码，因为 Web 显式依赖 `frontend/packages/desktop-contract`；Vercel 官方把 **Include source files outside of the Root Directory** 作为共享包的开关，并说明新项目通常默认开启。[Vercel：Monorepos FAQ](https://vercel.com/docs/monorepos/monorepo-faq)

仓库已经符合 Vercel 自动跳过未受影响项目的关键条件：根 `package.json` 声明 Bun workspace 和 `packageManager`，workspace package 名唯一，Web 在 `dependencies` 中显式声明内部 contract。Vercel 会利用 workspace 依赖图判断 Web 或其内部依赖是否变化；lockfile 变化也会按依赖影响参与判断。[Vercel：Skipping unaffected projects](https://vercel.com/docs/monorepos#skipping-unaffected-projects)

`frontend/apps/web/vercel.json` 从 monorepo 根调用 `build:web`；根脚本内部用 Turborepo 的 `--filter=@scopify/web` 限定构建图。它不得设置 Desktop 环境变量，也不得调用 `build:desktop`；`framework`、`buildCommand` 都是 Vercel 官方支持的项目配置项。[Vercel：Project Configuration](https://vercel.com/docs/project-configuration) [Vercel：Turborepo](https://vercel.com/docs/monorepos/turborepo)

### 1.2 域名接入

1. 先在 Vercel Project 添加 apex 和/或 `www` 域名。
2. 用 `vercel domains inspect <domain>` 读取当前项目要求的 A/CNAME/TXT 值，不把示例 IP 或 CNAME 永久抄入仓库。
3. 在 Cloudflare DNS 创建 Vercel 要求的记录，并设为 **DNS only（灰云）**。
4. 再次 inspect，确认域名验证与 Vercel TLS 证书完成。

Vercel 官方要求：外部 DNS 提供商（官方示例也点名 Cloudflare）应在该提供商处添加 `domains inspect` 给出的记录，再回到 Vercel 验证。[Vercel：Setting up a custom domain](https://vercel.com/docs/domains/set-up-custom-domain)

Vercel 明确不建议在 Vercel 前叠 Cloudflare reverse proxy：它会降低 Vercel 对真实流量的可见性、增加延迟并引入双层缓存问题；如果仍保留 Cloudflare 管 DNS，应对 Vercel 记录使用灰云模式。[Vercel：Should I use Cloudflare in front of Vercel?](https://vercel.com/kb/guide/cloudflare-with-vercel) [Vercel：Vercel WAF vs Cloudflare WAF](https://vercel.com/kb/guide/vercel-waf-vs-cloudflare-waf)

## 2. Cloudflare：DNS、安全与 API 边界

### 2.1 负责的内容

| 主机名 | Proxy 状态 | Cloudflare 职责 | 构建职责 |
| --- | --- | --- | --- |
| Web apex / `www` | DNS only | 权威 DNS、DNSSEC（启用前按现网验证） | 无；由 Vercel 构建 Next.js |
| `api.<domain>` | Proxied | DDoS 防护、WAF custom/managed rules、API 限流与流量分析 | 无；后端仍由自己的平台构建运行 |
| TXT/MX/验证记录 | DNS only | DNS 托管 | 无 |

Cloudflare 说明，DNS-only 只返回源站记录且 HTTP 流量不经过 Cloudflare；Proxied 才会把 Cloudflare 放入请求链，并应用 DDoS、WAF、缓存和 redirect rules。因此 Web 与 API 必须按主机名分开选择，而不是整区统一“全开代理”。[Cloudflare：Proxy status](https://developers.cloudflare.com/dns/proxy-status/)

对 `api.<domain>`，WAF 可以检查 Web/API 请求并用 ruleset 过滤流量；rate limiting rules 适合保护登录、验证码等入口免受暴力请求，或限制单客户端 API 调用率。[Cloudflare：Web Application Firewall](https://developers.cloudflare.com/waf/) [Cloudflare：Rate limiting rules](https://developers.cloudflare.com/waf/rate-limiting-rules/)

### 2.2 不负责的内容

- 不创建 Cloudflare Pages project。
- 不把 Next.js Web 编译为 Worker。
- 不用 Wrangler 编排 Web build。
- 不对 Vercel Web hostname 开橙云、Cache Everything 或第二套 WAF。
- 不让 API proxy 隐式承担业务鉴权；WAF/限流是边缘保护，后端仍是身份、权限和数据规则的权威。

如果未来业务硬性要求 Cloudflare 专属安全能力覆盖 Web，应另开 ADR，明确接受双 CDN、真实客户端信号受损、延迟与缓存一致性成本；不能把它作为默认开关。[Vercel：Cloudflare with Vercel](https://vercel.com/kb/guide/cloudflare-with-vercel)

## 3. Desktop Renderer artifact 发布链

### 3.1 强制流水线

```text
tag v*
  │
  ├─ renderer job (ubuntu)
  │   ├─ frozen install
  │   ├─ build Web desktop profile once
  │   ├─ sync renderer + create manifest
  │   ├─ verify protocol/version/content SHA-256/source commit
  │   └─ upload immutable artifact
  │
  ├─ package windows ─┐
  │   download same  │
  │   verify again   ├─ release job
  │   package only   │   ├─ collect platform artifacts
  └─ package macOS ──┘   ├─ generate SHA256SUMS.txt
                          ├─ attest release binaries
                          └─ create GitHub Release
```

GitHub 定义 workflow artifact 的用途之一就是在同一 workflow 的 job 之间传递构建产物；下游 job 用 `needs` 等待生产 job，再用 `download-artifact` 获取指定 artifact。[GitHub：Workflow artifacts](https://docs.github.com/en/actions/concepts/workflows-and-actions/workflow-artifacts) [GitHub：Store and share data with workflow artifacts](https://docs.github.com/en/actions/tutorials/store-and-share-data)

`actions/upload-artifact` v4+ 的 artifact 是不可变的，并输出 artifact ID、URL 和 SHA-256 digest；`download-artifact` 会重新计算并校验下载内容与上传 digest。这个 digest 保护 GitHub artifact 传输，Renderer 自己的 manifest/content hash 则保护解压后的文件树和应用协议约束，两者不能互相替代。[GitHub 官方 `upload-artifact`](https://github.com/actions/upload-artifact) [GitHub：Validating artifacts](https://docs.github.com/en/actions/tutorials/store-and-share-data#validating-artifacts)

### 3.2 Renderer manifest 必须锁定的字段

Renderer 构建后必须生成并校验：

| 字段 | 约束 |
| --- | --- |
| `bridgeProtocolVersion` | 等于 `@scopify/desktop-contract` 导出的当前协议版本 |
| `buildTarget` | 必须为 `desktop` |
| `rendererVersion` | 等于 Web package version |
| `manifestVersion` | 等于 contract 当前支持的 manifest schema 版本 |
| `sourceRevision` | 等于触发 release 的 `github.sha` |
| `artifactSha256` | 对排除 manifest 自身后的 Renderer 文件树做确定性 SHA-256 |

Renderer job 还会把目录封装为 `renderer-<commit>.tar.gz` 并生成独立 `.sha256`；每个 package job 先显式验证压缩包 checksum，再解压并运行同一 manifest verifier。GitHub 自身的 artifact digest 不匹配当前只产生 warning，因此发布门禁不能只依赖下载 action 的隐式校验。[GitHub：Validating artifacts](https://docs.github.com/en/actions/tutorials/store-and-share-data#validating-artifacts)

Renderer job 在构建前还会要求 tag、root、Web 与 Desktop package version 完全一致。任一验证失败立即停止，禁止“缺 manifest 时继续”、禁止由 Windows/macOS job 重建 Web 来补产物。

### 3.3 平台包与 Release

- Windows/macOS job 只构建 Electron main/preload 并执行 `electron-builder --win` / `--mac`；不使用带 `--publish` 的脚本。
- 每个平台的 `dist` 可发布文件先上传为独立 workflow artifact，排除 unpacked app 目录。
- 汇总 job 下载两个平台 artifact，生成一个 `SHA256SUMS.txt`，再一次性创建 GitHub Release，避免两个 matrix job 并发编辑同一个 Release。
- Release 二进制使用 GitHub artifact attestation 记录 build provenance。官方要求 `id-token: write`、`contents: read`、`attestations: write`，并用 `actions/attest@v4` 的 `subject-path` 指向二进制。[GitHub：Using artifact attestations](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations)
- Release 由 `gh release create <tag> <assets...>` 创建并附带 changelog；这是 GitHub 官方支持的发布方式。[GitHub：Managing releases](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)

## 4. Turborepo 的职责边界

Turborepo 只负责 workspace 内的任务图、依赖顺序与缓存：

- Vercel 构建调用 `@scopify/web` 的普通 `build`。
- Renderer job 调用 `@scopify/web` 的 `build:desktop`。
- Desktop package job 调用 `@scopify/desktop` 的 `build`，但不得依赖再次执行 Web build。
- Cloudflare 配置不进入 `turbo.json`，因为 Cloudflare 不参与应用构建。

Turborepo 官方建议在 CI 中通过 `--filter` 只运行目标 package 及其所需依赖；filter 可以按 package name 选择任务范围。[Turborepo：Running tasks](https://turborepo.com/docs/crafting-your-repository/running-tasks) [Turborepo：Using filters](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters)

## 5. 验收清单

### Vercel

- [ ] Dashboard 只有一个 Web project，Root Directory 为 `frontend/apps/web`。
- [ ] 普通 build 未设置 `SCOPIFY_BUILD_TARGET=desktop`。
- [ ] 修改 Desktop-only 文件时，Vercel Web deployment 被跳过。
- [ ] 修改 `desktop-contract` 时，Web deployment 会执行。
- [ ] `vercel domains inspect` 显示域名和 TLS 正常。

### Cloudflare

- [ ] 指向 Vercel 的记录均为 DNS-only。
- [ ] API 使用独立 hostname；只有该 hostname 按需 Proxied。
- [ ] WAF 与 rate limit 规则只覆盖明确的 API path/host。
- [ ] 仓库没有 Pages/Workers Web 构建或 Wrangler Web 发布步骤。

### Desktop Release

- [ ] 一次 tag run 只构建一次 Renderer。
- [ ] Windows/macOS 均下载同名、同 digest 的 Renderer artifact。
- [ ] 两个平台打包前都验证 archive SHA-256、manifest schema、协议、source revision 和 artifact hash。
- [ ] Release 包含安装包、updater metadata、`SHA256SUMS.txt` 与 provenance attestation。
- [ ] 任一构建、校验或平台打包失败时不创建 Release。

## 参考资料

- [Vercel：Using Monorepos](https://vercel.com/docs/monorepos)
- [Vercel：Monorepos FAQ](https://vercel.com/docs/monorepos/monorepo-faq)
- [Vercel：Project Configuration](https://vercel.com/docs/project-configuration)
- [Vercel：Setting up a custom domain](https://vercel.com/docs/domains/set-up-custom-domain)
- [Vercel：Cloudflare with Vercel](https://vercel.com/kb/guide/cloudflare-with-vercel)
- [Cloudflare：Proxy status](https://developers.cloudflare.com/dns/proxy-status/)
- [Cloudflare：WAF](https://developers.cloudflare.com/waf/)
- [Cloudflare：Rate limiting rules](https://developers.cloudflare.com/waf/rate-limiting-rules/)
- [GitHub：Workflow artifacts](https://docs.github.com/en/actions/concepts/workflows-and-actions/workflow-artifacts)
- [GitHub：Artifact validation](https://docs.github.com/en/actions/tutorials/store-and-share-data#validating-artifacts)
- [GitHub：Artifact attestations](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations)
- [GitHub：Managing releases](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)
- [Turborepo：Running tasks and filters](https://turborepo.com/docs/crafting-your-repository/running-tasks)
