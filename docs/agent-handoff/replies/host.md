# HostAgent → Lead 回执

## 2026-04-16T12:00Z — HostAgent：阶段 2 sync-service 可选镜像（M2.3）

- **对应 Lead 指令**：from-lead.md 中 §HostAgent（阶段 2；Last updated 2026-04-15）
- **已完成**：
  - `app-shell` 增加 **默认关闭** 的 sync mirror：勾选「启用 sync-service 事件镜像」后，在连接前经页面 modal 确认，对 `task.*`、`audit.record`、`session.join` / `session.joined` 做 **best-effort** `POST {base}/v1/events`；`fetch` 失败静默，**不影响** Relay / Runtime主链路。
  - 字段映射：`workspaceId` = 信封 `workspaceId`（缺省为字符串 `default`）；`sessionId` = 信封 `sessionId`（可与 Relay 分配一致）；`source` = **`app-shell`**；`envelope` = 完整契约 JSON。
  - **默认 base URL**：`http://127.0.0.1:9797`（与 `services/sync-service` 的 `SYNC_PORT` 默认一致）；可编辑并写入 `localStorage`（`tdl:syncBaseUrl` / `tdl:syncMirrorEnabled`）。
  - Runtime bridge 回注 Relay 的每条 emit 亦会同样 mirror（便于 History 看到 `task.accepted` 等）。
- **未完成 / 阻塞**：未在本机跑通「sync-service 进程 + Host mirror」端到端写入验证（可后续 `pnpm --filter @the-damn-life/sync-service dev` 联调）。
- **涉及路径**：`apps/app-shell/src/bridge/sync-mirror.ts`、`apps/app-shell/src/bridge/relay-host-session.ts`、`apps/app-shell/src/main.ts`、`apps/app-shell/src/bridge/index.ts`
- **SHA**（当前 `HEAD`）：`306757c4bfd1d25d82460795927af1cde84f4f7d`

## 2026-04-15T20:05Z — HostAgent：Tauri Host 实机验证通过（WebView fetch 127.0.0.1 OK，事件回流 OK）

- **对应 Lead 指令**：from-lead.md 中「签-off 动作 #2：Tauri Host 实机验证」（Last updated 2026-04-15）
- **已完成**：
  - Relay：`ws://127.0.0.1:18765/ws?session=tauri-smoke&role=host|remote`
  - Runtime bridge：`http://127.0.0.1:19876`（Host 内对 `task.submit` 转发 `POST /handle`）
  - 远端（最小脚本）提交 `task.submit` 后，Remote 收到回流事件：`audit.record`、`task.accepted`、`task.started`、`task.progress`、`skill.invoked`、`skill.completed`、`task.completed`（证明 Host WebView 能 fetch `http://127.0.0.1:19876/handle` 且 emits 经 Relay 回流）
- **关键限制**：
  - WebView 下 `window.confirm` 可能不可见，需使用页面内 modal（已修复）；否则会表现为“connect cancelled by user”
  - 首次 Rust 依赖下载对网络敏感；建议先 `cargo fetch` 预热并处理 `$HOME/.cargo/.package-cache` 陈旧锁
- **session**：`tauri-smoke`
- **SHA**：`306757c4bfd1d25d82460795927af1cde84f4f7d`

## 2026-04-15T20:00Z — HostAgent：Tauri dev 不再卡 crates.io（待用户点击确认完成闭环）

- **对应 Lead 指令**：from-lead.md 中「签-off 动作 #2：Tauri Host 实机验证」（Last updated 2026-04-15）
- **已完成**：
  - 解决 `tauri dev` 卡在 `Updating crates.io index`：通过 `cargo fetch` 预热依赖缓存（并清理过一次 `$HOME/.cargo/.package-cache` 陈旧锁文件）
  - 修复 Tauri 构建错误：
    - `src-tauri/Cargo.toml`：`tauri-build` 改为 `[build-dependencies]`（build.rs 依赖正确注入）
    - 生成缺失的 icons：新增 `src-tauri/icon.svg`，运行 `pnpm tauri icon` 生成 `src-tauri/icons/*`，解决 `failed to open icon ... icons/icon.png`
  - 当前 `pnpm --filter @the-damn-life/app-shell tauri dev` 可在 macOS 启动并运行 `target/debug/the-damn-life-desktop`（桌面 WebView 已可用）
  - 将宿主侧“出站确认”由 `window.confirm` 改为 **页面内 modal**（避免 WebView 下 confirm 不显示导致自动取消）
- **未完成 / 阻塞**：
  - **E2E 闭环仍未签-off**：需要在已启动的 Tauri Host 窗口里用 session=`tauri-smoke` 连接 Relay（`ws://127.0.0.1:18765/ws?session=tauri-smoke&role=host`）并填写 Runtime bridge（`http://127.0.0.1:19876`）后点击连接；当前 remote 脚本发送 `task.submit` 仍收到 `system.error peer_offline`，说明 Host 端尚未连入该 session
- **session**：`tauri-smoke`
- **SHA**：`306757c4bfd1d25d82460795927af1cde84f4f7d`

## 2026-04-15T19:00Z — HostAgent：Tauri Host 实机验证（失败：Rust crates 拉取阻塞）

- **对应 Lead 指令**：from-lead.md 中「签-off 动作 #2：Tauri Host 实机验证」（Last updated 2026-04-15）
- **已完成**：
  - 启动 Relay（本机端口冲突，改用 `:18765`）：`ws://127.0.0.1:18765/ws?session=tauri-smoke&role=remote|host`
  - 确认本机已有 `runtime-py bridge_http` 可用（`http://127.0.0.1:19876/handle` 能返回 NDJSON：含 `task.accepted`/`task.completed` 等）
  - 用最小 remote 脚本向 Relay 发送 `task.submit`（session=`tauri-smoke`），收到 `system.error`（peer_offline）符合「Host 未连入」现象
- **未完成 / 阻塞**：
  - `pnpm --filter @the-damn-life/app-shell tauri dev` 在 Rust 侧长期停留在 `Updating crates.io index`/大量 fetch，未能进入可操作的桌面 WebView 阶段，因此无法验证「WebView fetch `http://127.0.0.1:<port>/handle` + 事件回流」闭环
- **关键限制**：
  - **首次 Tauri/Rust 依赖下载对网络敏感**；若所在网络对 crates.io/git 索引访问慢/受限，会导致签-off 阻塞
- **session**：`tauri-smoke`
- **SHA**：`306757c4bfd1d25d82460795927af1cde84f4f7d`

## 2026-04-15T12:00Z — HostAgent：Runtime HTTP 显式确认 + 联调状态

- **对应 Lead 指令**：from-lead.md 中 §HostAgent（下一动），Last updated 2026-04-15
- **已完成**：在「连接 Relay」流程中，若填写了 Runtime bridge 基址，则增加与 Relay 同级的 **`window.confirm` 出站授权**；拒绝时仍连 Relay 但不向 `POST …/handle` 转发（并写 `runtime.http.denied_by_user` 审计）；同意则冻结本次会话的 `allowedRuntimeBase` 并写 `runtime.http.consented`。`@the-damn-life/app-shell` 的 `typecheck` 通过。另在本环境对 **`bridge_http` 单测式 HTTP**：`curl POST http://127.0.0.1:9876/handle` 收到含 `task.accepted` / `task.completed` 等的 NDJSON（与 `forwardEnvelopeToRuntime` 路径一致）。
- **未完成 / 阻塞**：本机 **无 `go` / `cargo`**，未执行 Lead 所列 **Relay + Host + Remote 全链路冒烟**，也未在 **Tauri WebView** 下验证；预期对 `127.0.0.1` 的 fetch 与 Vite 一致，待有工具时复跑步骤1–5 并在本条更新。
- **涉及路径或 PR**：`apps/app-shell/src/main.ts`

## 2026-04-15T00:00Z — HostAgent：Relay 握手 URL 与 Lead 指令对齐

- **对应 Lead 指令**：from-lead.md 中 §HostAgent（Last updated 2026-04-15）
- **已完成**：默认 Relay WebSocket 通过 `buildRelayHostWsUrl()` 生成，固定包含 `session` 与 `role=host`，与 `relay-go` `/ws?session=…&role=remote|host` 一致；出站连接与 `permission.*` 仍经显式确认；本地审计仍为 Tauri `append_host_audit_line` →数据目录下 `host-audit.ndjson`（浏览器调试时打日志）。
- **未完成 / 阻塞**：`onRuntimeWire` 与本地 `runtime-py` 通路的实际转发/进程管理仍待 RuntimeAgent 与 E2E 联调；未跑全仓 `pnpm build`（本环境限制）。
- **涉及路径或 PR**：`apps/app-shell/src/bridge/relay-url.ts`、`apps/app-shell/src/main.ts`、`apps/app-shell/src/bridge/index.ts`

（在文件 **顶部** 追加新条目；最上面为最新。）
