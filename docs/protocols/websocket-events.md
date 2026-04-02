# WebSocket Events Protocol

模块间 WebSocket 事件定义 — 实时通信的消息格式与事件类型规范。

## 🎯 Purpose

定义系统中所有 WebSocket 通信的事件类型、payload 结构和传输规则，确保 Frontend ↔ Runtime ↔ Relay 之间的实时消息格式统一。

```
┌──────────┐   WS Event   ┌──────────┐   WS Event   ┌──────────┐
│ Frontend │ ◄───────────► │ Runtime  │ ◄───────────► │  Relay   │
└──────────┘               └──────────┘               └──────────┘
                 ▲                           ▲
                 └─── websocket-events.md ───┘
```

## 📦 Event Envelope

所有 WebSocket 消息遵循统一信封格式：

```json
{
  "type": "event.name",
  "payload": {},
  "timestamp": "ISO 8601",
  "traceId": "uuid"
}
```

## 📋 Event Categories

### Task Events

| Event            | Direction          | Description  |
| ---------------- | ------------------ | ------------ |
| `task.created`   | Frontend → Runtime | 新建任务     |
| `task.started`   | Runtime → Frontend | 任务开始执行 |
| `task.progress`  | Runtime → Frontend | 任务进度更新 |
| `task.completed` | Runtime → Frontend | 任务完成     |
| `task.failed`    | Runtime → Frontend | 任务失败     |

### Approval Events

| Event                | Direction          | Description  |
| -------------------- | ------------------ | ------------ |
| `approval.requested` | Runtime → Frontend | 请求用户审批 |
| `approval.granted`   | Frontend → Runtime | 用户同意     |
| `approval.denied`    | Frontend → Runtime | 用户拒绝     |

### Audit Events

| Event            | Direction          | Description      |
| ---------------- | ------------------ | ---------------- |
| `audit.appended` | Runtime → Frontend | 新增审计日志条目 |

### Skill Events

| Event             | Direction          | Description    |
| ----------------- | ------------------ | -------------- |
| `skill.invoked`   | Runtime → Frontend | Skill 被调用   |
| `skill.completed` | Runtime → Frontend | Skill 执行完成 |
| `skill.error`     | Runtime → Frontend | Skill 执行异常 |

### System Events

| Event              | Direction          | Description |
| ------------------ | ------------------ | ----------- |
| `system.heartbeat` | Bidirectional      | 心跳保活    |
| `system.connected` | Runtime → Frontend | 连接建立    |
| `system.error`     | Runtime → Frontend | 系统级错误  |

## 📐 Payload Schema

事件 payload 的具体 schema 定义在 `packages/event-contracts` 中，本文档仅定义事件类型枚举和传输格式。

## 🔗 Related

- [packages/event-contracts](../../packages/event-contracts/) — TypeScript 事件类型定义
- [packages/shared-schema](../../packages/shared-schema/) — 运行时 payload 校验
- [docs/protocols/](./README.md) — 协议总览
