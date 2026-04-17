# 🧪 Experimental Skills

实验性技能 — 探索阶段，不承诺稳定性。

## 🎯 Role

系统的**技能孵化区**，容纳正在验证的技能原型。通过实验验证后可提升为 `builtin/`。

```
idea ──► experimental/ ──验证──► builtin/
              │
              └── 不稳定、可能随时移除
```

## ✅ Responsibility

- 容纳处于原型 / 验证阶段的技能
- 提供独立的实验环境，不影响核心功能
- 记录实验状态与已知限制

## 🚧 Boundaries

- 不保证 API 稳定性或向后兼容
- 不作为产品默认技能分发
- 不绕过 Skill 规范约束（仍须提供 `manifest.json`）

## 📁 目录结构

```
experimental/
├── README.md
└── example/             # 最小可运行实验示例
    ├── manifest.json
    ├── main.py
    └── README.md
```
