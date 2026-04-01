# MVP 范围冻结 V1.0（相对 V0.5 的扩展说明）

> **关系**：[`mvp_scope_v0_5.md`](mvp_scope_v0_5.md) 仍为历史「最小闭环」冻结；本文件描述 **当前对用户可承诺的 V1.0 能力边界**，与 [`project_plan_v1_3.md`](../project_plan/project_plan_v1_3.md) 已交付范围一致；**路线图**见 [`project_plan_v1_4.md`](../project_plan/project_plan_v1_4.md)（新能力入承诺前须修订本文件）。

---

## In Scope（V1.0 承诺）

1. **连接与配对**：配对码、WebSocket、心跳、设备在线状态。
2. **任务流水线**：自然语言或规则解析为 `TaskPlan`（schema 校验）、显式审批、`planned → running → succeeded|failed|cancelled`。
3. **文件整理**：按扩展名归类移动；**审批前干跑预览**（仅 `organize_downloads`）。
4. **可选任务类型**（若环境就绪）：网页正文抓取（Lightpanda 侧车）、CLI 便签 echo。
5. **可选规划**：`DAMN_LIFE_PLANNER=ollama` 或 `DAMN_LIFE_INFERENCE_PROVIDER=ollama` 时走 Ollama；失败回退为不支持。
6. **审计**：事件时间线、审批记录；**哈希链**；`auditChainVerify` 可校验。
7. **收据**：`GET /api/receipt?taskId=` 导出 JSON。
8. **安全开关**：`DAMN_LIFE_CORS_ORIGIN`、`DAMN_LIFE_REQUIRE_WS_TOKEN`；严格 smoke 可验证令牌模式。
9. **门禁**：weekly + red team + 宿主/移动端 dist 体积（脚本见根目录 `package.json`）。

---

## Out of Scope（V1.0 明确不做）

- 互联网 P2P、NAT 穿透、多设备同步市场。
- Skill 商店、Token 经济。
- 浏览器扩展深度集成（占位除外）、语音与视觉默认交付。
- MCP 默认进宿主（仅 [mcp_spike.md](mcp_spike.md) 级文档/实验）。
- 光学推理硬件依赖（仅叙事上可通过 InferenceProvider 扩展）。

---

## 验收锚点

- `整理下载文件夹`（及带 `targetDir` 的 e2e）全链路：计划 → 预览（若有）→ 审批 → 执行 → 审计。
- `npm run smoke:e2e` + `smoke:e2e-success` + `check:gate` 通过；可选 `npm run smoke:strict`。

---

*更新时请同步 [`README.md`](../README.md)、[`project_plan_v1_3.md`](../project_plan/project_plan_v1_3.md) 与路线图 [`project_plan_v1_4.md`](../project_plan/project_plan_v1_4.md)。*
