# 🧪 Test Utils

测试工具库 — 共享的 mock、fixture、helper，避免各包重复造轮子。

## 🎯 Role

系统的**测试基础设施层**，为所有 TS 包提供统一的测试辅助工具，降低测试编写成本。

```
apps/* ─────┐
services/* ──┤── devDependency ──► @the-damn-life/test-utils
packages/* ──┘
```

## ✅ Responsibility

- 通用 mock 工厂（createMockTask / createMockUser 等）
- 测试 fixture 与 seed data
- 自定义 matcher / assertion helper
- 测试环境 setup / teardown 工具
- Render helper（集成 React Testing Library 配置）

## 🚧 Boundaries

- **仅供 `devDependencies` 引用**，不进入生产构建
- 不包含具体模块的业务测试用例
- 不包含 E2E / 集成测试框架配置（见 `infra/ci/`）

## ⚙️ Tech Stack

TypeScript（兼容 Vitest / Jest）
