# 🧪 Dev Mock Server

开发环境 Mock 服务 — 本地开发时模拟后端接口。

## 🎯 Role

系统的**开发辅助层**，在后端服务未就绪时为前端 apps 提供模拟 API 响应，加速本地开发与联调。

```
┌──────────┐     HTTP/WS     ┌──────────────────┐
│  apps/*  │ ◄─────────────► │ dev-mock-server  │
└──────────┘                 └──────────────────┘
                              (模拟 runtime-py
                               + relay-go 接口)
```

## ✅ Responsibility

- 模拟 Runtime API 响应
- 模拟 Relay WebSocket 事件
- 提供可配置的 fixture 数据
- 支持延迟 / 错误注入（测试异常路径）

## 🚧 Boundaries

- **仅用于开发环境**，不进入生产部署
- **不做** 真实 AI 编排或 Skill 执行
- **不做** 真实数据持久化
- **不替代** 集成测试或 E2E 测试

## ⚙️ Tech Stack

> 待定 — 初始化阶段预留，后续确定技术选型。

## 📌 Status

**预留** — 当前为占位目录，不影响初始化阶段。
