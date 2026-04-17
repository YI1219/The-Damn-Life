# 📱 App Shell Platform

多端平台适配层 — 以 Web 为基座，各端增量覆盖原生能力。

## 🎯 Role

此 `platform/` 目录属于 `apps/app-shell`，采用**基座 + 增量**架构：`web/` 提供纯 Web 基础实现和统一接口定义，其他端在此基础上注入原生能力。

```
              ┌─────────┐
              │  web/   │  ← 基座：接口定义 + Web 默认实现
              └────┬────┘
       ┌──────┬────┼────┬──────┐
       ▼      ▼    ▼    ▼      ▼
   macos/ windows/ linux/ android/ ios/
   各端覆盖原生能力，复用 web 基础实现
```

## ⚠️ 与顶层 `platform/` 的区别

| 目录                       | 层级       | 职责                                     |
| -------------------------- | ---------- | ---------------------------------------- |
| `apps/app-shell/platform/` | 前端 UI 层 | 客户端界面的平台适配（窗口、手势、布局） |
| 顶层 `platform/`           | 系统抽象层 | OS / 硬件 / 沙箱 / 守护进程的底层能力    |

- **本目录**：Web 能力基座 + 各端原生增量适配（Tauri IPC、系统菜单、手势、通知等）
- **顶层 platform/**：封装操作系统 API、GPU/NPU 硬件能力、安全沙箱、系统守护进程等底层能力

## 🧩 架构原则

1. **web/ 是基座** — 定义 `PlatformAdapter` 接口，提供所有能力的 Web 默认实现
2. **各端继承 web/** — 仅覆盖需要原生替代的能力，其余复用 Web 实现
3. **能力检测** — 运行时自动检测平台环境，选择合适的 adapter
4. **纯 Web 可部署** — 不依赖任何原生宿主也能独立运行

## 📂 Structure

```
platform/
├── web/        # 基座：PlatformAdapter 接口 + Web 默认实现
├── macos/      # extends web — macOS 原生覆盖（系统菜单、Spotlight）
├── windows/    # extends web — Windows 原生覆盖（任务栏、通知中心）
├── linux/      # extends web — Linux 原生覆盖（系统托盘、DBus）
├── android/    # extends web — Android 原生覆盖（手势、状态栏）
└── ios/        # extends web — iOS 原生覆盖（手势、安全区域）
```

## 🔀 各端覆盖范围示例

| 能力     | web/（基座）           | macos/              | windows/            | android/       |
| -------- | ---------------------- | ------------------- | ------------------- | -------------- |
| 通知     | Web Notification API   | Tauri native notify | Tauri native notify | Android notify |
| 文件访问 | File System Access API | Tauri fs plugin     | Tauri fs plugin     | Android SAF    |
| 剪贴板   | Clipboard API          | _(复用 web)_        | _(复用 web)_        | _(复用 web)_   |
| 窗口管理 | DOM 窗口 / 标签页      | Tauri window API    | Tauri window API    | Activity 管理  |
| 通信     | HTTP / WebSocket       | Tauri IPC + WS      | Tauri IPC + WS      | HTTP / WS      |
| 系统托盘 | _(不支持)_             | NSStatusBar         | 系统托盘 API        | _(不支持)_     |
