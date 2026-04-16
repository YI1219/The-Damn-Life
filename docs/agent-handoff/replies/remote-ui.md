# RemoteUIAgent → Lead 回执

## 2026-04-16T12:00Z — 阶段 2：sync-service 可选 mirror + History只读面板

- **对应 Lead 指令**：from-lead.md 中 §RemoteUIAgent（阶段 2：mirror + History）
- **已完成**：
  - **Mirror 开关**：Session 栏「Sync mirror」—默认 base `http://127.0.0.1:9797`（`VITE_SYNC_BASE` / localStorage `tdl:syncServiceBase`），勾选「Mirror inbound/outbound…」后对每条 **入站/出站**契约 JSON 做 **best-effort** `POST /v1/events`，`source: web-console`；**workspaceId** 取 `session.joined` 带回的 id，否则取 Session 表单；失败不阻断 Relay。
  - **History 面板**：第四栏只读；连接 **ready** 且 workspace 可解析时自动 `GET /v1/events?workspaceId=…&sinceSeq=0&limit=200`，并支持 **Refresh history**；过滤约定与 sync-service一致（仅 **workspaceId**，session 仅在行内展示）。
  - **保留**：`hostId` 仍仅在 Activity 次级展示（非设备表）。
- **未完成 / 阻塞**：无
- **涉及路径**：`apps/web-console/src/App.tsx`、`apps/web-console/src/hooks/useRelaySession.ts`、`apps/web-console/src/sync/syncApi.ts`、`apps/web-console/src/index.css`、`apps/web-console/src/vite-env.d.ts`
- **git rev-parse --short HEAD**：`306757c`

## 2026-04-15T10:22Z — 签-off #1：真实 web-console UI 冒烟 ✅通过

- **对应 Lead 指令**：from-lead.md 中「签-off 动作 #1：真实 web-console UI 冒烟」
- **已完成**：同机启动 relay-go（`:8765`）+ runtime-py `bridge_http`（`:9876`）+ Host（`app-shell` dev `:1420`）+ Remote（`web-console` dev `:5173`），Remote 以 `session=demo` 连接并提交 task，UI 可见 `task.accepted` / `task.completed` 且包含 `skill.invoked` / `skill.completed`（活动区与任务列表均更新）。
- **未完成 / 阻塞**：无
- **session 值**：`demo`
- **git rev-parse --short HEAD**：`306757c`

## 2026-04-15T18:30Z — 冒烟对齐：bridge 回流事件映射 + 联调说明

- **对应 Lead 指令**：from-lead.md 中 §RemoteUIAgent（2026-04-15「联调冒烟」批次）
- **已完成**：
  - 对照 `runtime_core.TaskRuntime` / `test_bridge_http` 的发射序列，在 **`useRelaySession`** 中为 **`skill.invoked` / `skill.completed` / `skill.failed`** 增加显式分支：任务列表现 **`Invoked …` / `Skill … completed` / 失败文案**，活动区保留结构化 `payloadPreview`；原有 **`task.*`、`audit.record`、`permission.*`、`system.error`** 已覆盖 bridge 主路径。
  - **冒烟步骤（Remote 侧预期画面，文字等价「截图」）**：
    1. 与 Lead 文档一致先起 **relay-go**（`:8765`）、**`bridge_http`**（`9876`）、**Host**（同 `session`、填 bridge URL）、再 **`pnpm --filter @the-damn-life/web-console dev`**。
    2. Remote 左栏：**Relay path** 默认 `ws://127.0.0.1:8765/ws`，**Session id** 与 Host 完全一致 →底部预览 URL 含 `?session=…&role=remote` → **Connect**。
    3. 连接成功后左栏 **Status: Session active**；**Activity** 首条含 `session.joined` / `Joined session …`。
    4. 中栏 **Intent** 输入任意文案 → **Submit task** → 任务列表出现临时 `ui-…` 行，随后变为 runtime **`taskId`**，依次 **accepted → running**（含 **progress** 百分比）、**skill.\*** 文案、**completed** 与 **audit:** 行。
    5. 若 Host 未连或 session 不一致：**Activity** 出现 **`system.error`**（如 `peer_offline`），任务不会走完 — 属 Relay 预期而非 UI 缺陷。
- **未完成 / 阻塞**：本轮未在本机拉起 **Tauri Host** 做实机四口联调；代码路径已与 `runtime-py` 契约发射对齐，**完整勾选「阶段 1 Done ·冒烟」需有人按 E2E 步骤实跑并确认**。
- **涉及路径或 PR**：`apps/web-console/src/hooks/useRelaySession.ts`

## 2026-04-15T12:00Z — Remote UI：配对 URL 与 Lead 对齐

- **对应 Lead 指令**：from-lead.md 中 §RemoteUIAgent（2026-04-15 批次）
- **已完成**：默认 Relay 基址与 `services/relay-go/README.md` 一致（`:8765`、`/ws`）；连接前用 `buildRelayRemoteUrl` 强制附带 `session` + `role=remote`；表单拆成「Relay WebSocket path」与「Session id（与 host 同值）」并展示最终 URL预览；深链仍支持 `?relay=<完整 ws URL>`（可解析出 base/session）与 `?session=`；叙事保持任务/会话优先。
- **未完成 / 阻塞**：无
- **涉及路径或 PR**：`apps/web-console/src/App.tsx`、`apps/web-console/src/wire/relayUrl.ts`、`apps/web-console/src/hooks/useRelaySession.ts`、`apps/web-console/src/vite-env.d.ts`

（在文件 **顶部** 追加新条目；最上面为最新。）
