# 🧠 Runtime (Python)

AI 编排与 Skill 调度中心 — 系统的本地大脑。

## 🎯 Role

Runtime 是系统的**核心编排引擎**，负责接收任务、规划执行、调用模型、调度 Skill、上报事件。它是 AI 能力的实际执行者，但不是宿主——不直接持有系统最高权限。

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
