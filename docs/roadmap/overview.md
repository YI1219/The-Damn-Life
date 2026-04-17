# 路线图总览

本文档概括 **产品方向** 与阶段占位，与 [`docs/architecture/logical-environment.md`](../architecture/logical-environment.md) 中的技术定调一致。细则里程碑可在 `milestones/` 与 `backlog.md` 中展开（随项目推进补全）。

## 产品方向（已定调）

1. **多宿主、抽象呈现**  
   用户面对的是 **逻辑工作区与任务流**，而不是以设备清单为主控制台。物理宿主注册与连接是实现细节，可置于次级或运维视图。

2. **随身与远程入口**  
   通过手机等设备的浏览器（如 Web Console）管理同一逻辑环境，经中继与本地 Runtime 协同，与「本地优先、远程补充」原则一致。

3. **跨设备协作**  
   在同一逻辑工作区内，允许多台宿主 **分工执行**不同阶段或角色；共享状态与审计由同步与事件协议支撑，编排归属 Runtime，中继归属 Relay。

4. **权限与安全**  
   任何协作与中继路径仍须满足 **显式授权、可审计、强隔离**（见根目录 README 核心原则与 `docs/security/`）。

## 阶段占位

| 阶段 | 方向性目标（待细化） |
| ---- | -------------------- |
| 早期 MVP | 单宿主 + 远程 Web控制台 + 中继通路；验证事件与权限模型。 |
| 扩展 | 多宿主注册与抽象工作区；`sync-service` 与编排联动，呈现「协作流」而非「设备表」。 |
| 稳定 / GA | 冲突策略、故障与离线场景、运维级设备视图（可选）等生产化能力。拆解见 [`milestones/phase3-planning.md`](milestones/phase3-planning.md)。 |

## 相关文档

- [`docs/development/agent-playbook.md`](../development/agent-playbook.md) — 多 Agent 协作、TaskPacket、分支交付入口（当前阶段不要求 PR）
- [`docs/roadmap/release-targets.md`](release-targets.md) — R1 / R2 / R3 发布层级（与 TaskPacket `r_tier` 对齐）
- [`docs/architecture/logical-environment.md`](../architecture/logical-environment.md) — 多环境与协作的架构对齐
- [`docs/architecture/monorepo.md`](../architecture/monorepo.md) — 仓库分层与构建
- [`docs/protocols/README.md`](../protocols/README.md) — 事件与协议入口
