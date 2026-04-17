# Lead → 各 Agent 指令（最新）

> **多 Agent 协作、角色路由与 TaskPacket 真值**：以 [`docs/development/agent-playbook.md`](../development/agent-playbook.md) 为准；本文件保留 **阶段门控、CI 与 E2E 联调步骤** 等操作真值。

> **Last updated**: 2026-04-15（阶段 1 已签-off；**阶段 2 开发已开启**）  
> **变更摘要**：阶段 1（早期 MVP）验收完成：`pnpm e2e` ✅；真实 `web-console` UI 冒烟 ✅；Tauri Host WebView 实机 ✅（见 `replies/host.md` 2026-04-15T20:05Z）。阶段 2 当前聚焦：**M2.3 sync-service（只读镜像/查询）MVP 已落地** + 继续完善 **workspace /多对 relay分桶（`role:<key>`）** 的联调体验；契约仍冻结在 `0.1.0`（镜像 API 不走 `event-contracts`）。

## 全局门禁（延续上一轮）

| 检查 | CI | 备注 |
|------|-----|------|
| `pnpm install --frozen-lockfile` | 是 | |
| `pnpm typecheck` / `lint` / `build` | 是 | 本地现已具备 Go，可跑全量 Turbo |
| `sync-service` unit tests | 是 | `pnpm --filter @the-damn-life/sync-service test` |
| `relay-go` `go test` / `runtime-py` pytest | 是 | pytest 现 **6** 条（含 bridge） |

## 阶段门控

- **阶段 1 已签-off**：允许进入阶段 2 的 **实现交付**（按里程碑小步合并），但仍需保持边界：**中继无编排**、Runtime 无 UI、**契约变更仍先行**（`event-contracts` + `docs/protocols`）。

### 阶段 1 签-off（当前真值）

| 项 | 状态 | 依据 |
|----|------|------|
| 契约与协议（含 HTTP 桥说明） | **已对齐** | Contracts回执 + `websocket-events.md` |
| Host 对 Runtime HTTP 的显式授权 | **已做** | Host 回执（`confirm` + 审计键） |
| Remote 对 bridge 回流事件展示 | **已做** | Remote 回执（`skill.*` 等） |
| Relay 可观测性（不调语义） | **已做** | `RELAY_DEBUG=1` |
| **四口全链路冒烟**（relay + bridge + Host + Remote，同 session） | **已 UI 通过（web-console）** | RemoteUI 回执：`session=demo`，SHA `306757c`，UI 可见 `task.accepted`/`task.completed` + `skill.*` |
| **Tauri WebView** 下 Host | **已通过** | Host 回执（2026-04-15T20:05Z）：WebView fetch loopback + 事件回流 OK |
| **Tooling** 回执 | **已完成** | `replies/tooling.md`（lint 0 warnings + import 排序方案结论） |

**阶段 1 签-off**：✅ 已完成（Remote/Host 回执齐全 + 门禁全绿）。

### E2E 四口步骤（不变）

1. `services/relay-go`：启动 relay（默认 `:8765`）。可选 `RELAY_DEBUG=1`。  
2. `services/runtime-py`：`python3 -m src.bridge_http`（默认 `:9876`；若端口占用可 `RUNTIME_BRIDGE_PORT=9877`）。  
3. **Host**（`app-shell`）：与 Remote **同一 `session`**；填 Runtime bridge；**同意** Relay 与（若填写）Runtime HTTP 授权；连接。  
4. **Remote**（`web-console`）：同 session → Connect → Submit task。  
5. **预期**：Remote 侧任务/活动走完 **accepted → progress → skill.\* → completed**；Host 日志有 runtime wire；若异常附 Relay 调试日志（**无消息体**）。

---

## 下一阶段（阶段 2：小步可验收）各 Agent 做什么

### LeadAgent（总控，自领）

1. 以 `docs/roadmap/milestones/phase2-planning.md` 为阶段 2 的单一进度源：里程碑状态随代码合并同步更新（不再是“仅规划”）。  
2. **M2.3（进行中）**：`services/sync-service` 已提供 `POST /v1/events` + `GET /v1/events`（内存存储，Dev MVP）；CI 已跑其单测。下一步把 **Host/Remote 的可选 mirror** 接上，并补一条“离线回线拉历史”的冒烟路径。  
3. **M2.1/M2.2（继续夯实）**：`role:<key>` 多对并存 + `hostId` 透传 + `workspaceId` 贯穿；保持契约冻结。

### ContractsAgent

- **冻结** 0.1.0，**待命**。仅当签-off E2E 暴露缺字段/新事件时，开 **最小** TS+文档补丁并点名。

### RelayAgent

- **回执更新（建议）**：把 `role=host:<key>` / `role=remote:<key>` 的并存模型与 README 真值同步到 `replies/relay.md` 顶条（实现已合并：`services/relay-go`）。**不改**载荷语义。

### RuntimeAgent

1. 签-off 若发现 **bridge_http** 与契约不一致，最小修复 + pytest。  
2. 评估 **bind 面**：默认127.0.0.1 是否要在代码层 **拒绝非 loopback**（与 Host/安全叙事一致时再动）。  
3. **`replies/runtime.md` 顶条**：若已参与四口实跑，写结果；否则写「仍仅子路径」。

### HostAgent

1. **新动作（阶段 2）**：为 `sync-service` 增加可选配置（例如 base URL + enable 开关，默认关闭）：在 Host 侧对关键事件（至少 `task.*` / `audit.record` / `session.join*`）做 **best-effort** `POST /v1/events` mirror（失败不影响主链路）。  
2. **`replies/host.md` 顶条**：写明默认端口 `9797`、字段如何映射（`workspaceId/sessionId/source=app-shell`）。  
3. 既有 Tauri / runtime bridge 四口步骤仍保持可用。

### RemoteUIAgent

1. **新动作（阶段 2）**：与 Host 对称：可选 mirror 到 `sync-service`（同样默认关闭），并在 UI 增加一个 **History**（只读）面板：启动/连接后 `GET /v1/events?workspaceId=...` 拉取最近事件（用于“离线回线补看” MVP）。  
2. **已完成/继续保留**：`hostId` 的次级展示（Activity）不按设备表叙事渲染。  
3. **`replies/remote-ui.md` 顶条**：mirror 开关位置 + History 行为 + 与 `workspaceId` 的过滤约定。

### Tooling（Lead 自领，已回执）

1. `pnpm lint` 已达 **0 warnings**；若后续要收紧回 `no-console`，先对 scripts 做白名单配置。  
2. 方案结论已写入 `replies/tooling.md`：建议优先 `eslint-plugin-import-x`（ESLint 10 兼容）或 `simple-import-sort`。

---

## 回执规范提醒

- 新条目写在各自 **`replies/<role>.md` 的文件最上方**。  
- **勿**编辑 `from-lead.md`（由 Lead 覆盖）。
