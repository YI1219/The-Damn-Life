# The Damn Life 项目计划书 V1.3

> **上一版**：[`project_plan_v1_2.md`](project_plan_v1_2.md)  
> **修订日期**：2026-03-28  
> **结论**：宿主「再减重」边际已较小；本版以 **大众可感知的信任（干跑预览）**、**CI 可验证的安全默认（强制 WS 令牌）**、**推理提供方抽象（InferenceProvider）** 与 **范围冻结文档** 为主。

---

## 修订记录（V1.3）

| 项 | 说明 |
|----|------|
| 干跑预览 | `organize_downloads` 在审批前下发结构化 `preview`（只读模拟移动结果）。 |
| 严格 smoke | `runStrictSmoke`：子进程启主控且 `DAMN_LIFE_REQUIRE_WS_TOKEN=1` 后跑现有 e2e。 |
| 推理抽象 | [`host/src/inferenceProvider.ts`](host/src/inferenceProvider.ts) 统一入口；Ollama 实现在 [`host/src/inference/ollama.ts`](host/src/inference/ollama.ts)。 |
| 范围冻结 | [`docs/mvp_scope_v1_0.md`](docs/mvp_scope_v1_0.md) 描述 V1.0 对用户承诺与边界。 |
| MCP | [`docs/mcp_spike.md`](docs/mcp_spike.md) 技术验证说明（不进默认 gate）。 |

---

## 1. 执行摘要

在 V1.2 的 lean 内核、审计链、会话令牌、收据与门禁之上，V1.3 把 **「批准前可见后果」** 与 **「流水线可验证的令牌模式」** 产品化/工程化，并为 **多推理后端（Ollama → 未来光学等）** 预留统一调用面。

---

## 2. 与 V1.2 的承接

- V1.2 §3 P1 中「单一 WS 处理 / mobile gate」已落地；本版补齐 **干跑预览** 与 **strict smoke**。
- V1.2 §3 P2 中 **干跑** 在本版验收；**MCP / 双规划器** 仍属后续（MCP 仅文档 spike）。

---

## 3. 里程碑与验收

### A. 干跑预览（organize_downloads）

- 宿主 [`host/src/fileOrganizerSkill.ts`](host/src/fileOrganizerSkill.ts) 提供 `previewOrganizeDownloads`；[`host/src/wsConnection.ts`](host/src/wsConnection.ts) 在 `task.planned` 中附带 `preview`。
- 移动端展示摘要与可展开明细。

### B. 严格 smoke

- [`host/src/runStrictSmoke.ts`](host/src/runStrictSmoke.ts) + `npm run smoke:strict -w host`；根脚本 `smoke:strict`。

### C. InferenceProvider

- `DAMN_LIFE_PLANNER=ollama` 时走 `inferenceProvider` → `inference/ollama.ts`；新增后端时扩展 dispatcher，不增 npm 依赖。

### D. MCP

- 见 [`docs/mcp_spike.md`](docs/mcp_spike.md)。

### E. MVP 冻结

- 见 [`docs/mvp_scope_v1_0.md`](docs/mvp_scope_v1_0.md)。

---

## 4. 创新点（一句话）

**干跑预览** 将「模型/plan 不可信」转为用户可核对的 **操作表**，与审计链、审批形成信任闭环。

---

## 5. V1.4 预留

- 高风险 **双规划器一致性**、**Node 内置 SQLite**、**Preact 迁移** 不纳入 V1.3。
- **下一版路线图**：详见 [`project_plan_v1_4.md`](project_plan_v1_4.md)（里程碑、验收、与 [`docs/mvp_scope_v1_0.md`](docs/mvp_scope_v1_0.md) 的关系）。

---

*以 issue/里程碑跟踪；脚本名以仓库 `package.json` 为准。*
