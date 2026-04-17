# RelayAgent → Lead 回执

（在文件 **顶部** 追加新条目；最上面为最新。）

<!-- 模板见 ../README.md -->

## 2026-04-16T02:39Z — `role:<key>` 分桶并存与 README 真值对齐

- **对应 Lead 指令**：from-lead.md 中 §RelayAgent（阶段 2，Last updated 2026-04-15）
- **已完成**：核对 `services/relay-go` 实现：`role.ParseRef` 支持 `remote` / `host` 与 `remote:<key>` / `host:<key>`；`hub.Session` 按 **roleKey** 分桶，同一 `session` 下可多对 **1×remote + 1×host** 并存；同桶内同角色重连仍**替换**旧连接。转发与 `session.join` / `session.joined` 代答逻辑**未改载荷语义**。已将「key 大小写敏感（trim 后须与对端一致）」补入 `services/relay-go/README.md`；原有多分桶说明已与代码一致。
- **未完成 / 阻塞**：无
- **涉及路径或 PR**：`services/relay-go/README.md`、`docs/agent-handoff/replies/relay.md`

## 2026-04-15T12:30Z — 说明转发真值：`session.join` 可达性与多 host 替换

- **对应 Lead 指令**：from-lead.md 中 §RelayAgent（待命，Last updated 2026-04-15）
- **已完成**：确认 relay 当前真值：同一 `session` 为 **1×remote + 1×host** 槽位；同角色重复连接会**替换旧连接**（最后连接者生效）。`session.join` 会被转发给对端（若对端已连）；同时 Relay 会向**发送方**本地回 `session.joined`（带 `sessionId=<query session>`，回显 join payload 的 `workspaceId` 若提供），用于 handshake ready。已在 `services/relay-go/README.md` 补充说明。
- **未完成 / 阻塞**：无
- **涉及路径或 PR**：`services/relay-go/README.md`

## 2026-04-15T03:38Z — 待命 + 联调诊断日志

- **对应 Lead 指令**：from-lead.md 中 §RelayAgent（下一动，Last updated 2026-04-15）
- **已完成**：角色为**待命**；为便于 E2E 若出现「双端已连但转发异常」时抓取 **hub 日志与会话键**，在 `internal/hub` 增加 **`RELAY_DEBUG=1`** 可选日志（register/unregister/forward 元数据与字节长度，**不记录消息体**）；`README`已注明。未改转发语义与载荷。
- **未完成 / 阻塞**：未在本地跑通完整冒烟（环境未验证）；若仍丢包请附 `RELAY_DEBUG=1` 下日志与 `session` 值。
- **涉及路径或 PR**：`services/relay-go/internal/hub/debug.go`、`hub.go`、`README.md`

## 2026-04-15T12:00Z — Turbo/CI 可见入口与 go test

- **对应 Lead 指令**：from-lead.md 中 §RelayAgent（Last updated 2026-04-15）
- **已完成**：为 `services/relay-go` 增加 workspace `package.json`（`build` / `test` / `typecheck`→`go vet`）；`internal/ws` 增加 `ValidateEnvelope` 单测；CI 在 checkout 后即 `actions/setup-go`，再 `pnpm typecheck`（含 relay-go 的 `go vet`），随后在 `services/relay-go` 执行 `go test ./...`。握手仍为 `/ws?session=&role=remote|host`，默认端口与 README 一致（`RELAY_ADDR` 默认 `:8765`）。本地跑根目录 `pnpm typecheck` 需安装 **Go 1.22+**。
- **未完成 / 阻塞**：无
- **涉及路径或 PR**：`services/relay-go/package.json`、`services/relay-go/internal/ws/envelope_test.go`、`.github/workflows/ci.yml`

