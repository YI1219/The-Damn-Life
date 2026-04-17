# 🖥️ Platform

系统抽象层 — OS、硬件、沙箱、守护进程的统一抽象。

## 🎯 Role

Platform 是系统的**底层能力抽象层**，将不同操作系统、硬件设备、安全隔离等差异封装为统一接口，供上层 apps 和 services 调用。

```
apps/* / services/*
        ↕ bridge
┌──────────────────────────────────┐
│           platform/              │
├─ os ─ hardware ─ daemon ─ ...   │
└──────────────────────────────────┘
        ↕
   Operating System
```

## ✅ Responsibility

- OS 级差异适配
- GPU / NPU / 硬件能力抽象
- 守护进程管理
- 应用层 ↔ 系统层桥接
- 安全沙箱 / 权限隔离
- 系统级安装与服务部署
- 实验性 OS 能力探索

## ⚠️ 与 `apps/app-shell/platform/` 的区别

| 目录                       | 层级       | 职责                                     |
| -------------------------- | ---------- | ---------------------------------------- |
| 顶层 `platform/`           | 系统抽象层 | OS / 硬件 / 沙箱 / 守护进程的底层能力    |
| `apps/app-shell/platform/` | 前端 UI 层 | 客户端界面的平台适配（窗口、手势、布局） |

- **本目录**：封装操作系统 API、GPU/NPU 硬件能力、安全沙箱、系统守护进程等底层能力
- **app-shell/platform/**：处理 Tauri 窗口在不同 OS 上的布局差异、移动端手势适配等前端 UI 层差异

## 🚧 Boundaries

- **不做** 业务逻辑 → 仅提供系统能力抽象
- **不做** UI 渲染 → 交给 apps
- **不做** AI 编排 → 交给 runtime

## 📁 Directory

| Directory      | Description                            |
| -------------- | -------------------------------------- |
| `os/`          | 不同操作系统的桥接与适配               |
| `hardware/`    | AI-on-chip / GPU / NPU / 设备能力抽象  |
| `daemon/`      | 系统守护进程 / 后台代理                |
| `bridges/`     | 应用层 ↔ 系统层桥接                    |
| `sandbox/`     | 安全隔离 / 权限控制 / 链接空间底层实现 |
| `installers/`  | 系统级安装、注册、服务部署             |
| `experiments/` | 未来 OS 级实验性能力                   |
