# 📡 Event Contracts

统一事件命名与 payload 协议。

## 🎯 Role

模块间事件通信的**协议层**，统一定义事件名称、payload 结构，保证事件驱动架构中的类型安全。

## ✅ Responsibility

- 事件名称常量（`task.created`、`approval.requested`、`audit.appended` 等）
- 事件 payload 类型定义
- 事件订阅/发布的类型约束

## 🚧 Boundaries

- 仅定义协议，不实现事件总线
- 不包含具体业务处理逻辑

## ⚙️ Tech Stack

TypeScript
