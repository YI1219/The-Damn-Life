# 🔧 Scripts

仓库级工具脚本 — 开发、构建、发布辅助。

## 🎯 Role

Monorepo 的**开发工具层**，存放跨项目的开发辅助脚本。

## ✅ Responsibility

可直接使用：

- bootstrap — 仓库初始化与环境检查
- clean — 清理构建产物
- dev — 开发启动

规划中：

- release — 版本发布
- sync-types — 跨语言类型同步

## 🚧 Boundaries

- 不包含产品业务逻辑
- 不作为运行时依赖被 apps / services 引用

## ⚙️ Tech Stack

TypeScript + tsx
