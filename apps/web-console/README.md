# 🌐 Web Console

远程 Web 控制台 — 浏览器端的设备控制界面。

## 🎯 Role

Web Console 是系统的**远程控制端**，通过浏览器连接家中 / 远端设备，执行指令、查看状态、审批操作。它不是宿主，不拥有本地系统能力。

```
┌───────────────┐         ┌──────────────┐
│  Web Console  │──relay──│  App Shell   │
│  (Browser)    │         │  + Runtime   │
└───────────────┘         └──────────────┘
```

## ✅ Responsibility

- 远程查看任务状态
- 远程发送指令
- 审批危险操作
- 查看审计日志
- 管理 Skill

## 🚧 Boundaries

- **不做** 本地系统能力调用 → 无权限
- **不做** 直接文件系统访问 → 通过 relay 转发
- **不做** AI 编排 → 远程下发指令，由设备端 Runtime 执行

## ⚙️ Tech Stack

| Layer    | Tech                              |
| -------- | --------------------------------- |
| Frontend | React 19 + TypeScript + Vite      |
| Network  | 通过 `services/relay-go` 连接设备 |
