# MCP 播放控制

Scopify Desktop 提供一个默认关闭的本地 MCP 服务，让 AI 客户端读取播放状态并发送基础播放命令。
MCP 只依赖稳定的 `PlaybackGateway`，不知道 Zustand、HTML Audio 或未来 Native Engine 的实现。

## 启用与连接

在 **设置 → 桌面端 → MCP** 中启用服务并保存。点击“测试连接”会在 Main 进程内完成真实的
`initialize` 与 `tools/list` 请求；通过后再生成或查看客户端配置。

```json
{
  "mcpServers": {
    "scopify": {
      "type": "http",
      "url": "http://127.0.0.1:31927/mcp",
      "headers": {
        "Authorization": "Bearer <设置页生成的密钥>"
      }
    }
  }
}
```

- 服务只监听 `127.0.0.1`，默认端口为 `31927`。
- 密钥由 Electron `safeStorage` 加密保存，不进入 YAML、日志或普通状态接口。
- “查看最近配置”只读取当前有效凭据，不会轮换；配置在显式操作后显示于 JSON 悬浮面板。
- “生成新凭据”会轮换 Token，旧密钥立即失效；连接信息只应交给本机可信客户端。
- 最多保留 8 个协议会话，空闲 30 分钟自动释放。

## 工具与权限

| 权限               | 工具                                                                 |
| ------------------ | -------------------------------------------------------------------- |
| `playback.read`    | `get_playback_status`、`get_now_playing`                              |
| `playback.control` | `play`、`pause`、`toggle_playback`、`next_track`、`previous_track`、`seek`、`set_volume` |

`seek.positionMs` 使用毫秒；`set_volume.volume` 范围为 `0` 到 `100`。控制命令会等待 Renderer
Authority 的真实回执，不会在请求刚发出时就报告成功。返回快照不包含 Cookie、播放 URL、本地路径、
歌词正文或其他登录信息。

## 代码结构

```text
MCP HTTP / SDK
  → capabilities/mcp/tools/playback.ts
  → capabilities/playbackGateway/
  → capabilities/playbackBroker/
  → Renderer Playback Authority
  → 当前 HTML Audio Adapter（未来可替换为 Native Adapter）
```

- `capabilities/mcp/`：HTTP 安全边界、MCP Session、权限、凭据与工具注册。
- `ipc/mcp.ts`：只允许主 Renderer 测试连接、重启，以及显式查看或轮换密钥。
- `packages/desktop-contract/src/mcp.ts`：Renderer/Main 共享的非敏感配置与状态契约。
- `components/settings/McpSettingsSection.tsx`：桌面设置入口。

新增工具时先扩展 Gateway 或独立 Facade，并为权限拒绝、输入 Schema、回执映射和隐私投影补测试。
不要在 MCP handler 中直接访问 Electron Window、Zustand、音频元素或网络 Cookie。

## 调试

可运行 `npx @modelcontextprotocol/inspector`，选择 Streamable HTTP，填入设置页显示的 URL 和
`Authorization` Header。也可以先使用设置页的“测试连接”；失败时依次检查：设置是否已保存、
端口是否被占用、服务是否启动，以及客户端是否仍在使用已经轮换失效的旧密钥。
