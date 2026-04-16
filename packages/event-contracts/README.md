# 📡 Event Contracts

统一事件命名与 payload 协议。

## 🎯 Role

模块间事件通信的**协议层**，统一定义事件名称、payload 结构，保证事件驱动架构中的类型安全。

## ✅ Responsibility

- 事件名称常量（见 `src/messages.ts` 中 `EVENT_TYPES`）
- 事件 payload 与 `WsMessage` 判别联合（`src/payloads.ts`、`src/messages.ts`）
- 应用层 WebSocket 信封 `WireEnvelopeBase`（`src/envelope.ts`）
- Bundle 版本常量 `CONTRACT_VERSION`（`src/version.ts`）

人读事件表与拓扑见 [`docs/protocols/websocket-events.md`](../../docs/protocols/websocket-events.md)。

## 🚧 Boundaries

- 仅定义协议，不实现事件总线
- 不包含具体业务处理逻辑

## ⚙️ Tech Stack

TypeScript
