# 🔌 Relay (Go)

远程中继与会话网关 — 多端接入的通信桥梁。

## 🎯 Role

Relay 是系统的**远程通信层**，承担设备连接、会话桥接、指令转发。让 Web Console / 移动端能够远程控制家中设备上的 Runtime。

```
┌───────────────┐         ┌───────────┐         ┌──────────────┐
│  Web Console  │◄──────►│  relay-go  │◄──────►│  App Shell   │
│  (Remote)     │  WS/P2P │           │  WS/P2P │  + Runtime   │
└───────────────┘         └───────────┘         └──────────────┘
```

## ✅ Responsibility

- 设备注册与连接
- 会话桥接与管理
- 状态推送
- 指令转发
- 多端接入支持
- 后续 P2P 前的中继逻辑

## 🚧 Boundaries

- **不做** 用户业务数据长期存储 → 仅转发
- **不做** AI 任务编排 → 交给 `runtime-py`
- **不做** 本地系统能力执行 → 交给设备端

## ⚙️ Tech Stack

| Layer | Tech       |
| ----- | ---------- |
| Lang  | Go 1.22+   |
| Build | `go build` |

## 📁 Structure

```
relay-go/
├─ go.mod
├─ cmd/relay/main.go       # HTTP + /health + /ws
└─ internal/
   ├─ hub/                  # 按 session 桥接 remote ↔ host
   ├─ role/                 # 连接角色
   └─ ws/                   # WebSocket 升级与读写泵
```

## MVP 运行与握手

- `GET /health` → `{"status":"ok"}`
- WebSocket：`GET /ws?session=<逻辑会话ID>&role=remote|host`（`remote` = Web Console，`host` = App Shell / Runtime 侧）。扩展：`role=remote:<key>` / `role=host:<key>` 可在同一 `session` 下并存多对独立桥接（见 [`docs/protocols/websocket-events.md`](../../docs/protocols/websocket-events.md)）。
- 消息为 JSON 信封，至少含非空 `type`（见 [`docs/protocols/websocket-events.md`](../../docs/protocols/websocket-events.md)）；中继只做校验与透传，不实现编排或业务规则。**MVP 例外**：收到任一侧的 `session.join` 时，会向**发送方**本地回一个 `session.joined`（信封带 `sessionId=<query session>`；若 join payload 提供 `workspaceId` 则回显），用于让 UI 从 handshake 进入 ready；该 join 也会照常尝试转发给对端（更利于联调可观测性）。
- 环境变量：`RELAY_ADDR`（默认 `:8765`）；`RELAY_ALLOWED_ORIGINS` 为逗号分隔的 Origin 白名单，留空或 `*` 时在开发态允许任意 Origin。联调排查可设 **`RELAY_DEBUG=1`**：hub 会打印会话键、角色、注册/注销与转发结果（仅元数据与字节长度，不记录消息体）。

### 单 session 的并发连接约束（当前真值）

- **默认（无 `<key>`）**：每个 `session` 最多同时持有 1 个 `remote` 与 1 个 `host`（1:1 桥接）。同角色重复连接会替换旧连接（“最后连接者生效”）。
- **带 `<key>`**：同一 `session` 下可并存多组 `remote:<key>` ↔ `host:<key>`；每组内部仍是 1:1，组与组之间互不影响。`<key>` 在 trim 空白后**区分大小写**，须与对端一致方可配对。
- **Remote 是否能收到 Host 的 `session.join`**：可以（当两端都已用同一 `session` 且 **同一 `<key>`（或都为空）** 连上 Relay 时，`session.join` 会被转发给对端）；同时发送方会收到 Relay 本地回的 `session.joined`。

