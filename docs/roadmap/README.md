# 🗺️ Roadmap

项目路线图 — 里程碑规划、版本目标、优先级排序。

## 🎯 Role

项目的 **演进计划中心**，明确阶段目标与优先级，对齐团队方向。

```
 v0.1          v0.2          v0.3          v1.0
  │             │             │             │
  ▼             ▼             ▼             ▼
┌─────┐     ┌─────┐     ┌─────┐     ┌─────┐
│ MVP │ ──► │ 扩展 │ ──► │ 稳定 │ ──► │ GA  │
└─────┘     └─────┘     └─────┘     └─────┘

            docs/roadmap/
          (里程碑 & 目标)
```

## ✅ Responsibility

- 整体版本里程碑规划
- 各阶段核心目标与交付物
- 功能优先级排序
- 技术债务清理计划
- 已完成 / 进行中 / 计划中 状态追踪

## 🚧 Boundaries

- 不包含具体技术实现方案（见 `docs/architecture/`）
- 不替代 Issue Tracker / Project Board
- 不包含日常任务管理

## 📌 当前文档

- [`overview.md`](overview.md) — 产品方向与阶段占位（多宿主抽象呈现、随身入口、跨设备协作）
- [`milestones/phase2-planning.md`](milestones/phase2-planning.md) — 阶段 2（扩展）里程碑占位（仅规划）
- [`backlog.md`](backlog.md) — 技术债 & 待定项

## 📁 建议结构

```
roadmap/
├── overview.md          # 路线图总览（已有）
├── milestones/          # 里程碑详情
│   ├── v0.1-mvp.md
│   └── v0.2-expand.md
└── backlog.md           # 技术债务 & 待定项
```
