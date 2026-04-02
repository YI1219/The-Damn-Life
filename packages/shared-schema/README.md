# 📐 Shared Schema

运行时校验 Schema — 类型的运行时保障。

## 🎯 Role

比 `shared-types` 更底层的**运行时校验层**，提供 zod / JSON Schema / OpenAPI 定义，确保 API、WebSocket、Skill manifest 等 payload 在运行时可校验。

## ✅ Responsibility

- zod schema 定义
- JSON Schema 生成
- OpenAPI spec 生成
- 事件 payload schema
- Skill input/output schema

## 🚧 Boundaries

- 不包含业务逻辑
- 不依赖 `apps/*` 或 `services/*`

## ⚙️ Tech Stack

TypeScript + zod
