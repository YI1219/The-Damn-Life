# WebSocket 事件协议（阶段 1 MVP）

跨 **Remote（Web Console）**、**Relay（relay-go）**、**Host Runtime（runtime-py 等）** 的实时消息格式。编排与业务规则在 Runtime；Relay只做会话与转发，**不解析 `payload` 的业务语义**。

与 [`logical-environment.md`](../architecture/logical-environment.md) 一致：叙事以 **工作区 / 会话 / 任务** 为主；`sessionId` / `workspaceId` 用于逻辑绑定，**不**要求以设备清单为一级模型。

## 拓扑

```mermaid
flowchart LR
  WC["Web Console (clientRole: remote)"]
  R["relay-go (会话/转发，不编排)"]
  RT["Host Runtime (clientRole: host_runtime)"]
  WC <-->|同一套应用层 JSON 信封| R <-->|同一套应用层 JSON 信封| RT
```

## 传输层路由（Relay 握手查询参数）

Relay 的 WebSocket 握手使用 query 参数做会话配对（**不进入应用层信封**）：

- **`session`**：逻辑会话键。相同 `session` 的连接会进入同一 Relay Session。
- **`role`**：配对角色与可选分桶 key。
  - **基础形式**：`remote` / `host`
  - **分桶形式（阶段 2：多对并存）**：`remote:<key>` / `host:<key>`

### `role:<key>` 语义

- **目的**：在同一 `session` 下并存多对独立通道（每个 `<key>` 一对 `remote` ↔ `host`）。
- **配对规则**：
  - `remote:<key>` 仅与 `host:<key>` 配对；
  - `<key>` 为空等价于默认桶（兼容旧客户端的 `remote`/`host`）。
- **约束**：Relay 仍保持 payload 透明；应用层信封不需要增加字段即可实现“多宿主并存”。
- **与 `hostId` 的关系**：`hostId` 建议仍通过 `session.join.payload.capabilities`（如 `hostId=<uuid>`）做次级诊断信息；不要把 `<key>` 当作跨设备身份（它只是一次连接/分桶键）。

## 应用层信封（必填字段）

所有消息为 **一个 JSON 对象**，字段如下（与 `packages/event-contracts` 中 `WireEnvelopeBase` + 判别联合一致）。

| 字段 | 类型 | 说明 |
| ---- | ---- | ---- |
| `contractVersion` | string | 当前 bundle，如 `0.1.0` |
| `type` | string | 事件名（见下表） |
| `payload` | object | 按 `type` 解析 |
| `timestamp` | string | ISO 8601，建议 UTC |
| `traceId` | string | 端到端追踪 ID（如 UUID） |
| `correlationId` | string（可选） | 请求/响应或因果链 |
| `sessionId` | string（可选） | `session.joined` 之后业务消息建议带齐 |
| `workspaceId` | string（可选） | 逻辑工作区；单工作区 MVP 可省略 |

**约定**：Relay 若增加外层包装（例如内部路由头），须在实现 README 中说明；**应用层**仍以本文档信封为跨语言契约。

### `workspaceId` 缺省策略（阶段 2 起建议收敛）

- **发送方**：能提供就应填写 `workspaceId`（`session.join` payload 或 envelope 字段；后续业务消息优先用 envelope 字段）。  
- **Relay**：不生成、不推断 `workspaceId`；仅透明转发（MVP 的 `session.joined` 代答可回显 join payload 的 `workspaceId`）。  
- **Runtime**：若收到消息缺 `workspaceId`，可选择：
  - MVP/单工作区：继续处理但在 audit 中标记 `workspaceId` 缺失；或
  - 扩展期：返回 `system.error` 要求带 `workspaceId`（需 Lead 明确门控后再收紧）。

### 本地 Runtime HTTP 桥（阶段 1 可选）

与 WebSocket **无关的另一条物理路径**，但 **载荷与事件名仍须与本契约一致**（单一事实来源不变）：

| 项 | 说明 |
| ---- | ---- |
| 用途 | Host（如 `app-shell`）将自 Relay 收到的 **`task.submit` 等** 转发至本机 `runtime-py`，便于无长连 WebSocket 时的联调 |
| 请求 | `POST /handle`，`Content-Type: application/json`，body 为 **一条**与上表相同的 JSON 信封对象 |
| 响应 | `Content-Type: application/x-ndjson`；**每行一条** Runtime 按处理顺序 `emit` 的同类信封（如 `task.accepted`、`task.completed`） |
| 默认绑定 | 见 `services/runtime-py` README（默认 `127.0.0.1:9876`）；鉴权与非本机绑定须 **RuntimeAgent + HostAgent** 协定后再改契约侧描述 |

## 事件表（MVP）

方向列表示 **典型生产者 → 典型消费者**（经 Relay 转发，方向不变）。

### 会话与存活

| Event | 方向 | 说明 |
| ----- | ---- | ---- |
| `session.join` | Remote / Host → 对端 | `payload.clientRole`: `remote` \| `host_runtime`；可选 `workspaceId` |
| `session.joined` | Runtime（或 Relay 代答）→ Remote | 信封 **须** 带 `sessionId`；`payload` 可选 `workspaceId` |
| `session.leave` | 双向 | 优雅离开；`payload.reason` 可选 |
| `system.ping` | 双向 | 保活；`payload.nonce` 可选 |
| `system.pong` | 双向 | 回应 `system.ping` |
| `system.error` | 任意 → 对端 | `payload.code`, `payload.message`, `payload.fatal?` |

### 任务（Runtime 编排）

| Event | 方向 | 说明 |
| ----- | ---- | ---- |
| `task.submit` | Remote → Runtime | `intent` 必填；`clientTaskRef` 可选 |
| `task.accepted` | Runtime → Remote | Runtime分配 `taskId` |
| `task.started` | Runtime → Remote | |
| `task.progress` | Runtime → Remote | `step` / `percent` / `message` 可选 |
| `task.completed` | Runtime → Remote | |
| `task.failed` | Runtime → Remote | `code` / `message` / `retryable?` |

### 审批与显式权限

| Event | 方向 | 说明 |
| ----- | ---- | ---- |
| `approval.requested` | Runtime → Remote | `approvalId`, `prompt`；可选 `taskId` / `options` |
| `approval.respond` | Remote → Runtime | `decision`: `grant` \| `deny` |
| `permission.requested` | Runtime → Remote | `permissionId`, `scope`, `prompt` |
| `permission.resolved` | Remote → Runtime | `decision`: `grant` \| `deny` |

### 审计与 Skill 钩子

| Event | 方向 | 说明 |
| ----- | ---- | ---- |
| `audit.record` | Runtime → Remote | 结构化审计；见类型 `AuditRecordPayload` |
| `skill.invoked` | Runtime → Remote | 可选 `argsDigest`，**禁止**明文密钥 |
| `skill.completed` | Runtime → Remote | |
| `skill.failed` | Runtime → Remote | |

## Payload 类型

完整 TypeScript 定义见 [`packages/event-contracts`](../../packages/event-contracts/README.md)（`payloads.ts` / `messages.ts`）。Python / Go 应维护字段名一致的 struct。

## 与旧版草案的差异（记录）

- 拓扑从「Frontend ↔ Runtime」改为 **Remote ↔ Relay ↔ Host Runtime**。
- `task.created` 合并为 **`task.submit` + `task.accepted`**，明确 Runtime 分配 `taskId`。
- `approval.granted` / `approval.denied` 合并为 **`approval.respond`** + `decision`。
- `audit.appended` 重命名为 **`audit.record`**（与事件动词风格统一）。
- 增加 **`session.*`**、**`permission.*`**，支撑会话绑定与可审计权限路径。

## 相关文档

- [`versioning.md`](./versioning.md) — 契约版本与冻结流程
- [`README.md`](./README.md) — 协议索引
- [`packages/event-contracts`](../../packages/event-contracts/) — 规范源码
