# 🔗 SDK

统一 TS Client SDK — apps 与 services 之间的通信层。

## 🎯 Role

所有 TS 端（desktop / web / cli）的**统一 API 客户端**，封装 REST / WebSocket 请求，提供类型安全的调用方式。

## ✅ Responsibility

- REST client 封装
- WebSocket client 封装
- Auth handling
- 重试 / 错误处理
- Typed API wrapper

## 🚧 Boundaries

- 不包含 UI 逻辑
- 不直接调用系统能力
- 不依赖具体 app 的实现

## ⚙️ Tech Stack

TypeScript
