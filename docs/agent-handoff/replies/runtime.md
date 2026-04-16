# RuntimeAgent → Lead 回执

## 2026-04-15T12:00Z — bridge_http 与文档一致；pytest 与 HTTP 子冒烟通过；全链路 E2E 未在本机跑

- **对应 Lead 指令**：from-lead.md 中「RuntimeAgent（下一动）」及 E2E 冒烟步骤（Last updated 2026-04-15）
- **已完成**：核对 `bridge_http`：默认 `RUNTIME_BRIDGE_HOST=127.0.0.1`、`RUNTIME_BRIDGE_PORT=9876`，`POST /handle` 返回契约形 NDJSON；README 已补充与 Lead 冒烟步骤一致的 `cd services/runtime-py` + `python3 -m src.bridge_http`。**鉴权/非本地绑定**未改，仍按约定与 HostAgent 协定后再动。`python3 -m pytest` **6 passed**（含 `handle_envelope`）。本机另用 `curl` 对 `127.0.0.1` 临时端口 POST `task.submit`，首包为 `audit.record`、链路含 `task.accepted` / `task.completed`。
- **未完成 / 阻塞**：**五步全链路冒烟**（relay-go + bridge + app-shell + web-console 同 session）未在本 Agent 环境执行；阶段 1 Done 勾选依赖 Host / Remote 回执与一次端到端联调。
- **涉及路径或 PR**：`services/runtime-py/README.md`（启动说明）；`src/bridge_http.py`（无行为变更，仅文档对齐）

## 2026-04-15T08:00Z — Runtime：契约版本对齐、pytest 就绪、CI 待挂接

- **对应 Lead 指令**：from-lead.md 中「RuntimeAgent」小节（Last updated 2026-04-15）
- **已完成**：`services/runtime-py/src/wire.py` 中 `CONTRACT_VERSION` 与 `packages/event-contracts/src/version.ts`（`0.1.0`）一致；`pyproject.toml` 配置 `dev` 依赖与 pytest；`tests/` 覆盖 `TaskRuntime` 主路径、`task.submit` 入站、未知类型与未知 skill；本地可 `PYTHONPATH=. python3 -m pytest`。
- **未完成 / 阻塞**：`.github/workflows/ci.yml` 尚未增加 `runtime-py` 的 `pytest` job；`turbo run test` 未纳入本包（待 Lead 与 `tooling` 对齐仓库级测试编排）。
- **涉及路径或 PR**：`services/runtime-py/`（`src/wire.py`、`runtime_core.py`、`planning.py`、`skills.py`、`main.py`、`tests/test_main.py`、`pyproject.toml`）

（在文件 **顶部** 追加新条目；最上面为最新。）
