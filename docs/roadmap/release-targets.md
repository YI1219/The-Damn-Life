# 发布层级（R1 / R2 / R3）

> 与多 Agent 协作中的 **TaskPacket** 字段 `r_tier` 对应。Planner 派发任务时必须标注层级；Implement 以本页 + [`docs/development/agent-playbook.md`](../development/agent-playbook.md) 为共同约束。

## R1 — 可重复交付基线

- Host（`apps/app-shell`）+ web-console（`apps/web-console`）+ Relay（`services/relay-go`）+ Runtime（`services/runtime-py`）按文档步骤可端到端跑通。
- 关键 CI 脚本通过（以仓库根目录 `.github/workflows/ci.yml` 与 `agent-playbook.md` 的验收命令为准）。
- 若必须改契约：先改 `packages/event-contracts` 与 `docs/protocols/`，再改实现。

## R2 — 用户可感的稳定体验

- R1 全部满足，并补充：可观测/排障文档、离线/重连体验、sync 边界声明等对用户或集成方可见的声明与行为。

## R3 — GA 向能力

- R2 全部满足，并面向冲突策略、运维视图、安全深化等生产化项。

## 与路线图的关系

- 产品阶段叙述见 [`overview.md`](overview.md)。
- 稳定/GA 拆解参考 `milestones/phase3-planning.md`（若存在）。

# 发布层级（R1 / R2 / R3）

> 与多 Agent 协作中的 **TaskPacket** 字段 `r_tier` 对应。Planner 派发任务时必须标注层级；Implement / Review 以本页 + [`docs/development/agent-playbook.md`](../development/agent-playbook.md) 为共同约束。

## R1 — 可重复交付基线

- **Host**（`apps/app-shell`）+ **web-console**（`apps/web-console`）+ **Relay**（`services/relay-go`）+ **Runtime**（`services/runtime-py`）按文档步骤可端到端跑通。
- 关键 **CI** 脚本通过（见仓库根目录 `.github/workflows/ci.yml`与 [`agent-playbook.md` § 验收命令参考](../development/agent-playbook.md#验收命令参考)）。
- 契约变更仍须先改 `packages/event-contracts` 与 `docs/protocols/`，再改实现（全局门禁，各层通用）。

## R2 — 用户可感的稳定体验

- R1 全部满足，并补充：**可观测 / 排障文档**、**离线 / 重连**体验、**sync 边界**等对用户或集成方可见的声明与行为（细则见 [`milestones/phase3-planning.md`](milestones/phase3-planning.md) 中 M3.2 等条目）。

## R3 — GA 向能力

- R2 全部满足，并面向 **冲突策略**、**运维视图**、**安全深化** 等生产化项（见 `phase3-planning.md` 中 M3.1、M3.4 等）。

## 与路线图的关系

- 产品阶段叙述见 [`overview.md`](overview.md)。
- **R1 阶段不启动**与 M3.1（大规模存储 / 冲突主线）并行的「大迁移」；M3.1 应单独成包并排在 R1 核心交付之后，见 `phase3-planning.md` 风险与门控。
