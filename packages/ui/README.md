# 🎨 UI

共享 UI 组件库。

## 🎯 Role

跨端复用的**UI 组件层**，供 app-shell、web-console、admin-console 共享基础组件。

## ✅ Responsibility

- 基础组件（Button / Modal / Badge 等）
- 业务组件（TaskCard / AuditList / SkillCard 等）
- PermissionDialog / StatusBadge 等通用 UI

## 🚧 Boundaries

- 不包含业务逻辑或数据获取
- 不依赖任何具体 app
- 不直接调用 SDK 或 API

## ⚙️ Tech Stack

TypeScript + React 19
