# 阶段 2（扩展）里程碑（草案 checklist 已齐）

> 本文件用于将 `docs/roadmap/overview.md` 中的「扩展」阶段拆为可验收的里程碑与故事。  
> **注意**：阶段 1 已签-off；阶段 2 允许按里程碑 **小步落地**（仍遵守：契约变更走 Contracts；Relay 不编排、载荷透明）。

## 目标（扩展阶段的“方向性 Done”）

- 多宿主注册与连接可用，但 UI 仍以 **工作区/任务流** 为主叙事
- `sync-service` 与事件流联动，支撑跨设备状态与审计
- 运行时编排仍在 `runtime-py`，中继 `relay-go` 继续保持 payload 透明

## 建议里程碑（草案）

> 进度记录约定：用 checklist 标注 **Done / In progress / Todo**。  
> 每个里程碑至少应有一个“脚本/步骤可复现”的验收点（优先 CI/脚本，其次手工 UI）。

### M2.1 多宿主注册（最小）

- **交付**：Host 有稳定 identity（不等于用户概念），可被远端识别/重连
- **约束**：Remote 默认不出现设备表；设备视图应为次级/运维入口
- **验证**：同一 Remote 能在一个逻辑工作区内向两个 Host 发起独立会话（不要求协同编排）
- **实现提示（最小侵入）**：优先复用 `SessionJoinPayload.capabilities` 传递 `hostId=<uuid>` 等“可选能力/标识”，避免立即扩大契约；当需要强类型字段时再由 Contracts 介入。
- **Relay 最小支持**：允许 `role=host:<key>` / `role=remote:<key>`（同 session 下按 `<key>` 分桶配对），以便并存多对 Host/Remote 而不需要修改消息载荷语义。

- **Checklist**
  - [x] **Done**：Host 本地稳定 `hostId`（不引入用户概念）
  - [x] **Done**：`session.join.payload.capabilities` 透传 `hostId=<uuid>`（次级诊断）
  - [x] **Done**：Relay 支持 `role=host:<key>` / `role=remote:<key>` 分桶并存
  - [x] **Done**：Host/Remote UI 支持配置 `roleKey`（空值兼容旧行为）
  - [x] **Done**：E2E 覆盖两对并存 + 双 `task.completed` 断言（`pnpm e2e`）

### M2.2 抽象工作区（最小）

- **交付**：`workspaceId` 成为贯穿的一级上下文字段（契约不破坏兼容）
- **验证**：Remote 的任务与事件能按 `workspaceId` 过滤/聚合

- **Checklist**
  - [x] **Done**：E2E 覆盖 `workspaceId` 贯穿（接入断言）
  - [x] **Done**：Remote UI 显示 active `workspaceId` 并在任务/活动中携带
  - [x] **Done**：Remote UI 的 History / Workspace stream 支持按 `workspaceId` 聚合/过滤（默认 active context；History 可选 override 只读查询；stream 与 query 对齐，live 无 `workspaceId` 仍展示）

### M2.3 `sync-service` 联动（只读先行）

- **交付**：事件/审计可被同步服务订阅并提供只读查询（先不做冲突）
- **验证**：离线后回到在线，Remote 能看到历史 audit/task 轨迹

- **Checklist**
  - [x] **Done**：`services/sync-service` Dev MVP：`POST /v1/events` + `GET /v1/events`（内存存储）+ 单测
  - [x] **Done**：CI 纳入 `sync-service` 单测（见 `.github/workflows/ci.yml`）
  - [x] **Done**：Host/Remote 侧具备 **可选** mirror（best-effort，不影响主链路）
  - [x] **Done**：Remote 侧具备 History 读取能力（`GET /v1/events?workspaceId=...`）
  - [x] **Done**：脚本化“离线/回线”验收（`pnpm sync:smoke`）：模拟客户端离线导致 mirror 失败不影响流程；回线后可查询到此前已镜像的历史（内存存储不涵盖“服务重启后仍保留历史”）

### M2.4 协作流 UI（骨架）

- **交付**：UI 以“工作区内的任务与状态流”展示多宿主分工，不以设备表为中心
- **验证**：同一工作区下可看到来自不同 host 的事件来源（抽象化呈现）

- **Checklist**
  - [x] **Done**：工作区时间线（`web-console` **Workspace stream**：合并 live + sync mirror，按时间排序）
  - [x] **Done**：同一工作区下多宿主来源可辨识（Workspace stream：`host` / `peer` 自 envelope payload；本 tab的 relay **pair**（URL `roleKey`）在栏头说明，因 relay 不写入载荷）
  - [x] **Done**：最小“协作叙事”页面信息架构（`console-ia-rail` 流程说明 + 区内锚点；四栏 eyebrow：Transport / Primary / Collaboration / Diagnostics；不改 grid 与任务主路径）

## 风险与门控

- **协议漂移**：任何跨端字段变更必须先改 `packages/event-contracts` + `docs/protocols/`，再改实现
- **范围控制**：阶段 2 默认 **不**引入“设备表主叙事”；多宿主信息以工作区任务流/次级诊断展示为主

