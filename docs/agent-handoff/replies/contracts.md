# ContractsAgent → Lead 回执

## 2026-04-15T16:00Z — 待命：契约未改版本；补充 bridge_http 与 WS 同构说明

- **对应 Lead 指令**：from-lead.md 中 §ContractsAgent（下一动）（Last updated 2026-04-15，联调冒烟收尾轮）
- **已完成**：待命策略下做 **文档对齐**：在 `docs/protocols/websocket-events.md` 增加「本地 Runtime HTTP 桥」小节，明确 `POST /handle` + NDJSON 与 **同一应用信封/事件表** 同构；点名 **RuntimeAgent / HostAgent** 对鉴权与绑定变更需先协定再改契约描述。复查 `CONTRACT_VERSION` 0.1.0 与 `services/runtime-py/src/wire.py`、`EVENT_TYPES`（含 `task.submit` / `task.accepted`）一致，**未**发包级契约补丁。
- **未完成 / 阻塞**：无；若 E2E 冒烟暴露缺失字段/新事件，再开最小补丁并点名各端。
- **涉及路径或 PR**：`docs/protocols/websocket-events.md`

## 2026-04-15T12:00Z — 阶段 1 MVP 契约与协议文档已对齐为单一事实来源

- **对应 Lead 指令**：from-lead.md 中 §ContractsAgent（Last updated 2026-04-15）
- **已完成**：维持 `packages/event-contracts` 与 `docs/protocols/` 为单一事实来源：`CONTRACT_VERSION` 0.1.0、`WireEnvelopeBase`、`EVENT_TYPES`/`WsMessage` 与 MVP 载荷；`websocket-events.md`、`versioning.md`、`protocols/README.md` 索引与 `event-contracts/README.md` 已同步；拓扑与 Relay 透传约定已写明。已点名跟进方：**RelayAgent**（`/ws?session=&role=remote|host` 与信封/session 一致）、**RuntimeAgent**（`wire.py` 等同版本与事件名）、**HostAgent**（`clientRole: host_runtime` 等）、**RemoteUIAgent**（`role=remote`、同 `session`、任务/会话叙事）。
- **未完成 / 阻塞**：无
- **涉及路径或 PR**：`packages/event-contracts/**`、`docs/protocols/websocket-events.md`、`docs/protocols/versioning.md`、`docs/protocols/README.md`、`packages/event-contracts/README.md`、`packages/event-contracts/package.json`

（在文件 **顶部** 追加新条目；最上面为最新。）

<!-- 模板见 ../README.md -->
