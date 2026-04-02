# 🔌 Relay (Go)

远程中继与会话网关 — 多端接入的通信桥梁。

## 🎯 Role

Relay 是系统的**远程通信层**，承担设备连接、会话桥接、指令转发。让 Web Console / 移动端能够远程控制家中设备上的 Runtime。

```
┌───────────────┐         ┌───────────┐         ┌──────────────┐
│  Web Console  │◄──────►│  relay-go  │◄──────►│  App Shell   │
│  (Remote)     │  WS/P2P │           │  WS/P2P │  + Runtime   │
└───────────────┘         └───────────┘         └──────────────┘
```

## ✅ Responsibility

- 设备注册与连接
- 会话桥接与管理
- 状态推送
- 指令转发
- 多端接入支持
- 后续 P2P 前的中继逻辑

## 🚧 Boundaries

- **不做** 用户业务数据长期存储 → 仅转发
- **不做** AI 任务编排 → 交给 `runtime-py`
- **不做** 本地系统能力执行 → 交给设备端

## ⚙️ Tech Stack

| Layer | Tech       |
| ----- | ---------- |
| Lang  | Go 1.22+   |
| Build | `go build` |

## 📁 Structure

```
relay-go/
├─ go.mod
├─ cmd/
│  └─ relay/
│     └─ main.go        # 入口
└─ internal/             # 内部实现
```
