# The Damn Life V0.5+

单机闭环：手机/网页 UI 发自然语言指令 → 主控生成 **TaskPlan**（规则或可选 **Ollama**）→ 用户审批 → 执行（文件整理、可选 **Lightpanda** 抓页、CLI 便签等）→ **审计**（含哈希链）与查询。

## Workspace Layout

- `mobile/`: Vite + React PWA 式 UI
- `host/`: 极 lean 主控（`node:http` + `ws` + `better-sqlite3`），无 Fastify 类重型框架
- `skills/`: Skill 包（manifest + handler）
- `extension/`: 浏览器扩展占位
- `shared/`: 共享契约（可选）
- `tools/improver/`: **开发用** 迭代工具，不进入宿主发布依赖
- `docs/`: MVP 范围（[`mvp_scope_v0_5.md`](docs/mvp_scope_v0_5.md)、[`mvp_scope_v1_0.md`](docs/mvp_scope_v1_0.md)）、weekly gate、[MCP spike](docs/mcp_spike.md)、[CLI/API 适配器说明](docs/cli_api_adapter.md)
- `project_plan/`: 项目计划书（当前路线图 **V1.4**：[`project_plan_v1_4.md`](project_plan/project_plan_v1_4.md)；上一版交付说明 **V1.3**：[`project_plan_v1_3.md`](project_plan/project_plan_v1_3.md)）

## Quick Start

1. Node.js 20+.
2. 仓库根目录：

```bash
npm install
npm run dev
```

3. 浏览器打开 `http://localhost:5173`，主控默认 `http://<本机>:8787`。

### 可选能力

- **更广的自然语言规划**：本机安装 [Ollama](https://ollama.com)，拉取模型后设置 `DAMN_LIFE_PLANNER=ollama` 或 `DAMN_LIFE_INFERENCE_PROVIDER=ollama`（可选 `DAMN_LIFE_OLLAMA_MODEL`）。推理入口见 [`host/src/inferenceProvider.ts`](host/src/inferenceProvider.ts)。
- **抓取网页正文**：安装 [Lightpanda](https://github.com/lightpanda-io/browser) 二进制，可选 `LIGHTPANDA_PATH`；与宿主 **分开发行**，注意 **AGPL** 合规。
- **强制 WS 会话令牌**（局域网更安全）：`DAMN_LIFE_REQUIRE_WS_TOKEN=1`；配对后客户端须在 `task.command` / `task.approval` / `heartbeat` / `audit.query` 等负载中携带 `sessionToken`（`pair.ok` 下发）。
- **CORS**：生产环境设置 `DAMN_LIFE_CORS_ORIGIN` 为具体源（未设置时默认为 `*`，便于本地开发）。
- **受控 CLI（可选）**：设置 `DAMN_LIFE_CLI_ALLOWLIST`（逗号分隔，如 `echo,date`）后，自然语言 `执行CLI echo hello` 可生成 `cli_invoke` 任务；未设置 allowlist 时 `cli_invoke` 会被拒绝。详见 [`docs/cli_api_adapter.md`](docs/cli_api_adapter.md)。

## Gates & Smoke

主控需已启动（默认端口 `8787`，或设置 `HOST_PORT` / 测试时 `HOST_WS`）。

```bash
npm run smoke:e2e
npm run smoke:e2e-success
npm run check:gate
```

**强制会话令牌**（子进程起主控并 `DAMN_LIFE_REQUIRE_WS_TOKEN=1`，再跑 e2e；不占用你当前的 8787）：

```bash
npm run smoke:strict
```

可选：同时验证 CORS，例如 `STRICT_SMOKE_CORS_ORIGIN=http://localhost:5173 npm run smoke:strict`（子进程会设置 `DAMN_LIFE_CORS_ORIGIN`）。

`check:gate` 会执行全量 `npm run build`（保证 `host/dist` 存在以做体积门禁），再跑：`weeklyGate` + `redTeamGate` + `kernelMetricsGate` + **审计链校验** `auditChainVerify`。

- 仅红队 + 宿主 dist 体积：`npm run check:gate-lite`（需已 `npm run build`）。
- 移动端构建物体积（需先 `npm run build -w mobile`）：`npm run check:gate:mobile`。
- 单独校验审计链：`npm run verify:audit -w host`。

环境变量示例：`DAMN_LIFE_MAX_DIST_BYTES`、`DAMN_LIFE_MAX_MOBILE_DIST_BYTES`。

## API 速览

- `GET /health`、`GET /api/tasks`（支持 `sessionId`、`limit`）
- `GET /api/receipt?taskId=<uuid>`：任务 **执行收据** JSON（任务行 + 审批 + 审计摘要）
- WebSocket `/ws`：配对、任务流水线、审计查询（协议见 `host/src/wsConnection.ts`）

## Current Status

- 闭环、**整理任务干跑预览**、多任务类型、可选 Ollama（InferenceProvider）、可选 Lightpanda、红队/体积/审计链门禁、会话令牌、`smoke:strict`、收据与移动端信任文案已落地；交付说明见 [`project_plan/project_plan_v1_3.md`](project_plan/project_plan_v1_3.md)，**下一步路线图**见 [`project_plan/project_plan_v1_4.md`](project_plan/project_plan_v1_4.md)。
- 历史最小冻结：[`docs/mvp_scope_v0_5.md`](docs/mvp_scope_v0_5.md)。**当前对用户能力边界**：[`docs/mvp_scope_v1_0.md`](docs/mvp_scope_v1_0.md)。

## 开发工具

```bash
npm run improver
```

（`tools/improver` 工作区，与宿主内核发布无关。）
