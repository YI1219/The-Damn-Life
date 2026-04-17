# 🛠️ Admin Console

内部管理后台 — 调试与运维控制台。

## 🎯 Role

Admin Console 是系统的**内部管理界面**，用于开发调试、系统监控、高级配置。非面向终端用户，面向开发者和运维。

## ✅ Responsibility

- 系统运行状态监控
- Runtime 调试面板
- 事件流查看
- Skill 开发调试
- 高级配置管理

## 🚧 Boundaries

- **不做** 终端用户交互 → 交给 `app-shell`
- **不做** 远程设备控制 → 交给 `web-console`
- **不做** AI 编排 → 仅查看和调试

## ⚙️ Tech Stack

| Layer    | Tech                         |
| -------- | ---------------------------- |
| Frontend | React 19 + TypeScript + Vite |
