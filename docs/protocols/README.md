# 📡 Protocols

事件协议定义 — 模块间消息格式、事件类型、通信约定。

## 🎯 Role

系统的 **通信协议规范层**，定义模块之间的事件格式与消息传递规则，确保异构模块（TS / Python / Go / Rust）能够可靠通信。

```
┌──────────┐  event   ┌──────────┐  event   ┌──────────┐
│ Frontend │ ───────► │  Bridge  │ ───────► │ Runtime  │
└──────────┘          └──────────┘          └──────────┘
                  ▲                    ▲
                  └── docs/protocols/ ─┘
                    (协议定义层)
```

## ✅ Responsibility

- 事件类型枚举与生命周期
- 消息格式定义（Payload Schema）
- 事件路由与分发规则
- Bridge 层通信协议（Tauri Command / IPC）
- 跨语言序列化约定（JSON / MessagePack 等）

## 🚧 Boundaries

- 不包含协议的具体实现代码
- 不包含 REST/RPC 接口定义（见 `docs/api/`）
- 不定义业务逻辑，仅定义传输格式与路由规则

## 📁 建议结构

```
protocols/
├── overview.md          # 协议总览
├── events.md            # 事件类型定义
├── message-format.md    # 消息格式规范
├── bridge-ipc.md        # Bridge 层 IPC 协议
└── serialization.md     # 序列化约定
```
