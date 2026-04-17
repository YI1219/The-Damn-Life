# 📦 Shared Types

跨端共享 TypeScript 类型定义。

## 🎯 Role

所有 TS 项目共享的**纯类型层**，确保 apps / services / sdk 之间 DTO 定义统一。

## ✅ Responsibility

- Task / Audit / Skill / Session / Config 等 DTO 类型
- 跨端统一的接口定义

## 🚧 Boundaries

- **纯类型**，不包含运行时逻辑
- 不依赖 `apps/*` 或 `services/*`

## ⚙️ Tech Stack

TypeScript（纯类型包，无运行时依赖）
