# The Damn Life 项目计划书 V1.2

> **上一版**：[`project_plan_v1_1.md`](project_plan_v1_1.md)  
> **修订日期**：2026-03-28  
> **后续规划**：以 [`project_plan_v1_3.md`](project_plan_v1_3.md)（已交付）与 [`project_plan_v1_4.md`](project_plan_v1_4.md)（当前路线图）为准；**本文件保留 V1.2 时代基线与 backlog 快照。**  
> **范围**：在 V1.1 战略之上，对齐 **当前代码基线**，固化 **工程优化 backlog**、**产品创新主题** 与 **与 `docs/mvp_scope_v0_5.md` 的关系**（V0.5 冻结仍有效；超出项走新里程碑/新冻结文档）。

---

## 修订记录（V1.2）

| 项 | 说明 |
|----|------|
| 代码基线 | 宿主为 `node:http` + `ws` + `better-sqlite3`；多任务类型与 Ollama 规划（可选）；红队门禁、宿主 `dist` 体积门禁、可选移动端构建物体积门禁。 |
| 工程 | 宿主模块化（http / WS / 任务执行分离）；可配置 CORS；可选 WS 会话令牌（`DAMN_LIFE_REQUIRE_WS_TOKEN`）。 |
| 信任 / 创新 POC | 审计表 **哈希链**（防无痕篡改）；`auditChainVerify` 校验脚本；任务 **收据** HTTP 导出。 |
| 文档 | README 与仓库布局与真实能力对齐；`tools/improver` 与发布内核区分。 |

---

## 1. 执行摘要（继承 V1.1）

结论与「大众产品 + 极 lean 内核 + 安全默认」不变，见 V1.1 §1。V1.2 将 **已落地的门禁与侧车依赖** 写进计划正文，并列出 **下一批 P0–P2** 与 **创新验收**。

---

## 2. 当前代码基线（与仓库同步）

- **宿主** [`host/`](host/)：`http` 静态路由（`/health`、`/api/tasks`、可选 `/api/receipt`）；WebSocket `/ws`；SQLite；任务类型含 `organize_downloads`、`fetch_page_text`（Lightpanda 侧车）、`cli_note_echo` 等；规划见 [`host/src/planner.ts`](host/src/planner.ts) + 可选 [`host/src/inferenceProvider.ts`](host/src/inferenceProvider.ts)（Ollama 实现于 [`host/src/inference/ollama.ts`](host/src/inference/ollama.ts)）。
- **门禁**：`npm run check:gate` → weekly + red team + 宿主 `dist` 体积；可选 `npm run gate:mobile`（需先 `npm run build -w mobile`）。
- **移动端** [`mobile/`](mobile/)：Vite + React；PWA 式 UI。
- **开发工具** [`tools/improver`](tools/improver)：不进入宿主发布依赖；仅供迭代与实验。
- **侧车**：`lightpanda` 二进制 **不计入** 宿主 `dist` 体积门禁；AGPL 合规与分发边界需在发行说明中单独声明。

---

## 3. 优化 Backlog（分优先级）

**V1.3 已从本 backlog 关闭的项**（避免与 §3 P1/P2 重复理解）：

| 原条目（本节下文） | 落地 |
|--------------------|------|
| P1：启用令牌模式下 CI smoke | `npm run smoke:strict`（见 V1.3 §3 B） |
| P1：生产 CORS 显式源 | 环境变量 `DAMN_LIFE_CORS_ORIGIN` + strict smoke 可选 `STRICT_SMOKE_CORS_ORIGIN` |
| P2：干跑 / 后果预览 | `organize_downloads` 预览 + `task.planned.preview`（V1.3 §3 A） |
| P2：MCP（文档级） | [`docs/mcp_spike.md`](../docs/mcp_spike.md)（可运行 PoC 见 V1.4） |
| 更深：InferenceProvider | [`host/src/inferenceProvider.ts`](host/src/inferenceProvider.ts)（V1.3） |

**仍开放、已迁至 V1.4**：P1 移动端 bundle 深度分析 / Preact；P2 双规划器、Node 内置 SQLite、MCP 子进程 PoC 等——见 [`project_plan_v1_4.md`](project_plan_v1_4.md)。

### P0（已完成或本版落地）

- 宿主依赖保持 **ws + better-sqlite3**；HTTP/WS 与执行器 **分文件** 便于审计。
- **CORS**：环境变量 `DAMN_LIFE_CORS_ORIGIN`（未设时默认 `*` 以利本地开发）。
- **WS 会话令牌**：配对成功后下发 `sessionToken`；`DAMN_LIFE_REQUIRE_WS_TOKEN=1` 时强制校验（默认关闭以兼容现有 smoke）。
- **审计哈希链 + 校验脚本 + 收据导出**（POC 级，见 §5）。

### P1（建议下一迭代）

- 移动端 **bundle 分析与体积回归**（`vite build` + `mobileMetricsGate`）；`main.tsx` **WS 消息处理** 已在 [`mobile/src/wsMessageHandler.ts`](../mobile/src/wsMessageHandler.ts) 集中，接线层可继续收敛（见 V1.4 工程项）。
- ~~生产环境 **将 CORS 设为显式源**；在启用令牌模式下跑通 CI smoke。~~ **→ 已在 V1.3 关闭**（见上表）。

### P2（中长期）

- ~~**计划干跑 / 后果预览**~~ **→ V1.3 已交付（organize_downloads）。** 其它 taskType 预览见 V1.4 可选里程碑。
- **MCP 子进程适配器**（可运行 PoC）：V1.4 P2；V1.3 仅文档 spike。
- **高风险双规划器一致性**（研究 → 产品）：V1.4 P1。
- **SQLite**：评估 Node 内置 SQLite 以去掉原生编译（大改，单独里程碑）：V1.4 P2。

---

## 4. 产品创新主题与验收（V1.2）

| 主题 | 验收（本版） |
|------|----------------|
| 可验证审计链 | 新写入审计行含 `chain_prev_hash` / `record_hash`；`tsx src/auditChainVerify.ts` 退出码 0 |
| 执行收据 | `GET /api/receipt?taskId=` 返回 JSON（任务 + 审批 + 审计摘要） |
| 会话绑定 | `pair.ok` 含 `sessionToken`；可选强制校验 |
| 侧车边界 | 文档声明 Lightpanda 与内核分发分离 |

干跑与 InferenceProvider 已在 V1.3 落地；MCP 可运行 PoC、双规划器等见 [`project_plan_v1_4.md`](project_plan_v1_4.md) 与 V1.1 §1.2。

---

## 5. 与 `docs/mvp_scope_v0_5.md` 的关系

- **冻结范围内**：单机闭环、审批、审计、文件整理类能力仍以 MVP 为准。
- **超出冻结的实现**（多任务类型、Ollama、Lightpanda、收据、哈希链等）：以 **V1.x 能力** 标注；对外「当前承诺」见 [`docs/mvp_scope_v1_0.md`](../docs/mvp_scope_v1_0.md)。

---

## 6. 文档维护

- **当前推荐**：[`project_plan_v1_4.md`](project_plan_v1_4.md)（路线图）；[`project_plan_v1_3.md`](project_plan_v1_3.md)（刚完成的交付说明）；**V1.2** 为历史基线快照；V1.1 保留历史对照。
- 根目录 [`README.md`](../README.md) 应与门禁命令、可选环境变量、工作区布局同步更新。

---

*实施以 issue/里程碑跟踪；环境变量与脚本名称以仓库内实现为准。*
