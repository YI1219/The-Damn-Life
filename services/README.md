# ⚡ Services

后台服务层 — Runtime、中继、同步、开发辅助服务。

## 🎯 Role

系统的**后端执行层**，提供 AI 编排、远程通信、数据同步等核心后端能力。被 `apps/*` 通过 SDK / Bridge 间接调用。

```
apps/* ──► SDK / Bridge ──► services/*
                               │
                               ├── runtime-py      (AI 大脑)
                               ├── relay-go         (远程中继)
                               ├── sync-service     (数据同步)
                               └── dev-mock-server  (开发 Mock)
```

## ✅ Responsibility

| 服务               | 职责                          | 技术栈       | 状态        |
| ------------------ | ----------------------------- | ------------ | ----------- |
| `runtime-py/`      | AI 编排、Skill 调度、模型调用 | Python 3.11+ | 🔨 骨架就绪 |
| `relay-go/`        | 远程中继、会话桥接、指令转发  | Go 1.22+     | 🔨 骨架就绪 |
| `sync-service/`    | 多端状态同步、配置推送        | 待定         | 📌 预留     |
| `dev-mock-server/` | 开发环境 API Mock             | 待定         | 📌 预留     |

## 🚧 Boundaries

- 不包含 UI 渲染（见 `apps/`）
- 不包含共享类型或 SDK（见 `packages/`）
- 不直接暴露给终端用户，通过 apps 层消费
- 各服务之间松耦合，通过事件协议通信

## 🔗 服务间关系

```
                    ┌───────────────┐
                    │  runtime-py   │
                    │  (AI 编排)     │
                    └───────┬───────┘
                            │ 事件
                    ┌───────▼───────┐
                    │   relay-go    │ ◄──► 远程客户端
                    │   (中继)      │
                    └───────┬───────┘
                            │ 同步
                    ┌───────▼───────┐
                    │ sync-service  │
                    │  (状态同步)    │
                    └───────────────┘
```
