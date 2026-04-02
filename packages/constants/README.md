# 📌 Constants

跨端共享常量 — 枚举值、状态码、配置键名、魔法字符串的统一定义。

## 🎯 Role

系统的**常量单一来源**，确保 apps / services / packages 使用一致的枚举、状态码和配置键名，消除跨端硬编码。

```
apps/* ─────┐
services/* ──┤── import ──► @the-damn-life/constants
packages/* ──┘
```

## ✅ Responsibility

- 事件名称常量（与 `event-contracts` 对齐）
- 任务状态枚举（pending / running / completed / failed）
- 权限标识符
- 路由路径常量
- 错误码定义
- 配置键名

## 🚧 Boundaries

- **纯常量导出**，不包含运行时逻辑或函数
- 不包含类型定义（见 `shared-types`）
- 不包含校验逻辑（见 `shared-schema`）

## ⚙️ Tech Stack

TypeScript（纯值导出，零运行时依赖）
