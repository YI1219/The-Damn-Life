# 🧠 Runtime (Python)

AI 编排与 Skill 调度中心 — 系统的本地大脑。

## 🎯 Role

Runtime 是系统的**核心编排引擎**，负责接收任务、规划执行、调用模型、调度 Skill、上报事件。它是 AI 能力的实际执行者，但不是宿主——不直接持有系统最高权限。多宿主协作时，编排面向 **逻辑工作区内的步骤与约束**（放置策略为抽象层，不把 hostname 当作用户概念）；定调见 [`docs/architecture/logical-environment.md`](../../docs/architecture/logical-environment.md)。

```
apps/* ──→ SDK ──→ ┌────────────┐ ──→ skills/*
                   │ runtime-py │ ──→ models
                   └────────────┘ ──→ audit events
                         ↕
                   host bridge (受控)
```

## ✅ Responsibility

- 接收并规划任务
- 调用 LLM / 本地模型
- 调度 Skill 执行
- 文件理解与处理
- 自动化编排
- 审计事件上报
- 与 desktop / web / cli 交互

## 🚧 Boundaries

- **不做** 直接获取宿主最高权限 → 通过 host bridge 受控获取
- **不做** 用户界面渲染 → 交给 `apps/*`
- **不做** 远程穿透 / 中继 → 交给 `relay-go`
- **不做** 随意访问本机路径 → 权限受控

## ⚙️ Tech Stack

| Layer  | Tech           |
| ------ | -------------- |
| Lang   | Python 3.11+   |
| Build  | hatchling      |
| Config | pyproject.toml |

## 📁 Structure

```
runtime-py/
├─ pyproject.toml
├─ src/
│  ├─ __init__.py
│  └─ main.py
└─ tests/
   ├─ __init__.py
   └─ test_main.py
```

## Host 联调（HTTP bridge，MVP）

单宿主演示时，`app-shell` 可将 Relay 上收到的 `task.submit` POST 到本机 Runtime：

```bash
cd services/runtime-py   # 相对仓库根；与 docs/agent-handoff/from-lead.md「E2E 冒烟步骤」一致
# 默认仅绑定 127.0.0.1:9876/handle ；可用 RUNTIME_BRIDGE_HOST / RUNTIME_BRIDGE_PORT 覆盖
python3 -m src.bridge_http
```

Host UI 中「Runtime bridge」填入同一基址（如 `http://127.0.0.1:9876`）。**仅开发向**：服务开启 CORS `*`，勿对公网暴露。
