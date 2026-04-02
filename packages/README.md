# 📦 Packages

共享库层 — 供多个 app / service 复用的 workspace 包。

## 🎯 Role

系统的**共享基础设施**，所有可复用的类型、Schema、组件、SDK、配置、常量和测试工具统一收敛于此，被 `apps/*` 和 `services/*` 依赖。

```
apps/* ─────┐
services/* ──┤── import ──► packages/*
scripts/ ────┘
```

## ✅ Responsibility

| 包                 | 职责                                                  |
| ------------------ | ----------------------------------------------------- |
| `shared-types/`    | 跨端共享 TypeScript 类型定义（纯类型，零运行时）      |
| `shared-schema/`   | 运行时校验 Schema（zod / JSON Schema / OpenAPI 对齐） |
| `ui/`              | 共享 UI 组件库（React 19）                            |
| `sdk/`             | 统一 TS API Client SDK（REST / WebSocket）            |
| `event-contracts/` | 事件协议定义（事件名称 + payload 类型）               |
| `skill-manifest/`  | Skill manifest 规范与校验                             |
| `config/`          | 共享配置基座（tsconfig / ESLint / Prettier）          |
| `constants/`       | 跨端常量（枚举、状态码、配置键名）                    |
| `test-utils/`      | 测试工具（mock 工厂、fixture、assertion helper）      |

## 🚧 Boundaries

- 不包含业务应用代码（见 `apps/`）
- 不包含后端服务实现（见 `services/`）
- 包之间可互相依赖，但**禁止循环引用**
- `test-utils` 仅作为 `devDependencies` 引用

## 🔗 依赖方向

```
shared-types ◄── sdk / ui / event-contracts / skill-manifest
shared-schema ◄── sdk / skill-manifest
config ◄── 所有 TS 包（extends tsconfig）
constants ◄── apps / services / 其他 packages
test-utils ◄── 所有包的测试（devDependencies）
```

## ⚙️ 统一约定

- 包名 scope：`@the-damn-life/*`
- 模块格式：ESM（`"type": "module"`）
- 入口：`src/index.ts`
- 构建：`tsc -b`
- 共享配置：`@the-damn-life/config` 的 `tsconfig.base.json`
