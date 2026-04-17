# Sync Service

数据同步服务 — 多端状态一致性保障（阶段 2：从 **只读镜像 + 查询** 起步）。

## Role

系统的**同步协调层**，面向同一 **逻辑工作区** 的共享状态（任务/审计/关键事件镜像），而不是「设备清单」语义；定调见 [`docs/architecture/logical-environment.md`](../../docs/architecture/logical-environment.md)。

```
App Shell  --(POST /v1/events)-->  sync-service  <--(GET /v1/events)--  Web Console
```

## Responsibility（阶段 2 当前范围）

- 接收客户端 **可选**上报的契约信封镜像（`POST /v1/events`）
- 提供 **只读**历史查询（`GET /v1/events`）
- 为后续持久化/冲突策略预留 API 形状（当前不实现冲突合并）

## Boundaries

- **不做** AI 编排或 Skill 调度（交给 `runtime-py`）
- **不做** 远程中继或穿透（交给 `relay-go`）
- **不做** 与 `relay-go` 的紧耦合订阅（MVP：由 Host/Remote 选择是否 mirror；Relay 仍载荷透明）
- **不做** UI 渲染

## Tech Stack

| Layer | Tech |
| ----- | ---- |
| Lang | TypeScript (Node 22) |
| Run | `tsx` |

## MVP HTTP API（只读先行）

> Dev 默认 **进程内内存**存储（重启丢失）。后续再引入持久化；API 尽量保持稳定。

- `GET /health` → `{ "status": "ok" }`
- `POST /v1/events` → 写入一条镜像事件  
  - body：`{ "workspaceId": string, "sessionId"?: string, "source": string, "envelope": <Wire JSON> }`  
  - resp：`{ "ok": true, "seq": number }`
- `GET /v1/events?workspaceId=...&sinceSeq=0&limit=200` → `{ "items": StoredEvent[] }`

### 环境变量

- `SYNC_HOST`（默认 `127.0.0.1`）
- `SYNC_PORT`（默认 `9797`）
- `SYNC_ALLOW_ORIGIN`（默认 `*`，仅影响 CORS）

### 本地运行

```bash
pnpm --filter @the-damn-life/sync-service dev
```

## Status

**MVP 已落地（mirror + 查询 + 单测）** — 下一步把 Host/Remote 的关键事件 mirror 接上（不影响主链路）。

## 相关文档

- [`docs/protocols/websocket-events.md`](../../docs/protocols/websocket-events.md)
- [`docs/roadmap/milestones/phase2-planning.md`](../../docs/roadmap/milestones/phase2-planning.md)
