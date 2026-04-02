# 🏗️ Architecture

系统架构设计文档 — 整体结构、模块划分、数据流、决策记录。

## 🎯 Role

作为 **The Damn Life** 的架构蓝图，定义系统的宏观结构与模块间关系，为所有工程决策提供依据。

```
┌─────────────────────────────────────────┐
│              docs/architecture/          │
│                                         │
│  系统全局视角：结构 → 流程 → 决策       │
│                                         │
│  被引用方：所有模块的设计与实现          │
│  依赖方：无（顶层文档）                 │
└─────────────────────────────────────────┘
```

## ✅ Responsibility

- 系统整体架构图与模块拓扑
- 各层（UI / Runtime / Platform / Bridge）边界定义
- 数据流与事件流描述
- 架构决策记录（ADR）
- 模块间依赖关系与通信协议选型

## 🚧 Boundaries

- 不包含具体 API 签名（见 `docs/api/`）
- 不包含事件协议细节（见 `docs/protocols/`）
- 不包含实现代码或可运行脚本
- 不替代模块内部的设计文档

## 📁 目录结构

```
architecture/
├── README.md            # 本文档
├── monorepo.md          # Monorepo 结构、workspace、工具链
└── dependency-rules.md  # 模块间依赖规则与约束
```
