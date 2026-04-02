# 🐚 App Shell

Tauri 桌面端 — 系统主宿主入口。

## 🎯 Role

App Shell 是整个 The Damn Life 系统的**主宿主端**，承载桌面交互、本地设置、权限审批等用户侧核心体验。它是用户与系统交互的第一入口。

```
┌─────────────┐
│  App Shell  │──→ packages/sdk ──→ services/runtime-py
│  (Tauri)    │──→ packages/ui
└─────────────┘
      ↕ IPC
 src-tauri (Rust)
```

## ✅ Responsibility

- Tauri 壳 + 窗口管理
- 桌宠 / 桌面交互 UI
- 本地设置与配置界面
- 启动 / 停止本地 Runtime
- 权限审批入口
- 技能管理界面
- 链接空间管理

## 🚧 Boundaries

- **不做** AI 编排与任务规划 → 交给 `services/runtime-py`
- **不做** 具体 Skill 业务逻辑 → 交给 `skills/*`
- **不做** 远程穿透 / 中继 → 交给 `services/relay-go`

## ⚙️ Tech Stack

| Layer    | Tech                                                    |
| -------- | ------------------------------------------------------- |
| Frontend | TypeScript + Vite                                       |
| Host     | Rust (Tauri 2)                                          |
| Platform | `platform/web/` 基座 + 各端增量覆盖（macOS/Win/Linux…） |

## 📁 Structure

```
app-shell/
├─ src/           # 共享前端代码
├─ src-tauri/     # Tauri Rust 宿主
└─ platform/      # 多端适配（web 基座 + 各端原生增量）
   ├─ web/        # 基座：接口定义 + Web 默认实现
   ├─ macos/      # extends web
   ├─ windows/    # extends web
   ├─ linux/      # extends web
   ├─ android/    # extends web
   └─ ios/        # extends web
```
