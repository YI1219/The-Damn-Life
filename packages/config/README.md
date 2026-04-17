# ⚙️ Config

仓库级共享配置。

## 🎯 Role

Monorepo 的**配置基座**，提供所有 TS 子包共用的 tsconfig、ESLint、Prettier 基础配置。

## ✅ Responsibility

- `tsconfig.base.json` — 基础 TS 编译选项
- `tsconfig.react.json` — React 项目扩展配置
- 未来可扩展 ESLint / Vitest 共享配置

## 🚧 Boundaries

- 仅存放配置文件
- 不包含任何运行时代码或业务逻辑
