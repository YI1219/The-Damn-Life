# 阶段 2（扩展）里程碑（开发中）

> 本文件用于将 `docs/roadmap/overview.md` 中的「扩展」阶段拆为可验收的里程碑与故事。  
> **注意**：阶段 1 已签-off；阶段 2 允许按里程碑 **小步落地**（仍遵守：契约变更走 Contracts；Relay 不编排、载荷透明）。

## 目标（扩展阶段的“方向性 Done”）

- 多宿主注册与连接可用，但 UI 仍以 **工作区/任务流** 为主叙事
- `sync-service` 与事件流联动，支撑跨设备状态与审计
- 运行时编排仍在 `runtime-py`，中继 `relay-go` 继续保持 payload 透明

## 建议里程碑（草案）

### M2.1 多宿主注册（最小）

- **交付**：Host 有稳定 identity（不等于用户概念），可被远端识别/重连
- **约束**：Remote 默认不出现设备表；设备视图应为次级/运维入口
- **验证**：同一 Remote 能在一个逻辑工作区内向两个 Host 发起独立会话（不要求协同编排）
- **实现提示（最小侵入）**：优先复用 `SessionJoinPayload.capabilities` 传递 `hostId=<uuid>` 等“可选能力/标识”，避免立即扩大契约；当需要强类型字段时再由 Contracts 介入。
- **Relay 最小支持**：允许 `role=host:<key>` / `role=remote:<key>`（同 session 下按 `<key>` 分桶配对），以便并存多对 Host/Remote 而不需要修改消息载荷语义。

### M2.2 抽象工作区（最小）

- **交付**：`workspaceId` 成为贯穿的一级上下文字段（契约不破坏兼容）
- **验证**：Remote 的任务与事件能按 `workspaceId` 过滤/聚合

### M2.3 `sync-service` 联动（只读先行）

- **交付**：事件/审计可被同步服务订阅并提供只读查询（先不做冲突）
- **验证**：离线后回到在线，Remote 能看到历史 audit/task 轨迹
- **当前进度（Lead，2026-04-15）**：
  - ✅ `services/sync-service`：Dev MVP 已提供 `POST /v1/events` + `GET /v1/events`（内存存储）+ 单测；CI 已纳入该单测步骤（见 `.github/workflows/ci.yml`）。
  - Next：客户端 mirror（`app-shell` / `web-console` 侧 **可选**上报 + Remote 侧 History 拉取）。

### M2.4 协作流 UI（骨架）

- **交付**：UI 以“工作区内的任务与状态流”展示多宿主分工，不以设备表为中心
- **验证**：同一工作区下可看到来自不同 host 的事件来源（抽象化呈现）

## 风险与门控

- **协议漂移**：任何跨端字段变更必须先改 `packages/event-contracts` + `docs/protocols/`，再改实现
- **范围控制**：阶段 2 默认 **不**引入“设备表主叙事”；多宿主信息以工作区任务流/次级诊断展示为主

