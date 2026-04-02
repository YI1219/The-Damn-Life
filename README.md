# The Damn Life

AI Native Personal System — 本地优先的 AI 助手运行平台。

---

## 🧭 Core Principles

- **本地优先** — 数据与计算默认留在本地，远程仅作补充
- **显式权限** — 任何系统能力访问都需显式授权，绝不静默获取
- **强隔离** — Skill、Runtime、宿主之间严格沙箱隔离
- **事件驱动架构** — 模块间通过事件协议通信，松耦合
- **模块化与可扩展性** — 每个模块职责单一，通过 Skill 生态无限扩展

---

## 🏗️ Monorepo Structure

| Directory   | Role       | Responsibility                                      | Boundaries                                                |
| ----------- | ---------- | --------------------------------------------------- | --------------------------------------------------------- |
| `apps/`     | 用户入口层 | 提供桌面端、Web 控制台、CLI、管理后台等用户交互界面 | 不包含 AI 编排逻辑，不直接执行 Skill                      |
| `services/` | 后台服务层 | AI Runtime 编排、Skill 调度、中继穿透、设备同步     | 不拥有宿主最高权限，通过 bridge 受控获取能力              |
| `packages/` | 共享协议层 | 跨端共享类型、Schema、SDK、UI 组件、事件协议        | 不承载具体业务逻辑，不依赖 apps 或 services               |
| `platform/` | 系统抽象层 | OS 适配、硬件抽象、守护进程、安全沙箱、系统桥接     | 不包含业务逻辑，仅提供系统能力抽象                        |
| `skills/`   | 扩展生态层 | 内置技能、实验技能、技能模板                        | 不侵入系统内核，仅依赖 Skill Runtime SDK 和 manifest 规范 |
| `infra/`    | 基础设施层 | Docker、部署配置、CI/CD、打包脚本                   | 不包含运行时代码                                          |
| `docs/`     | 文档层     | 架构设计、API 规范、协议定义、开发指南              | 仅文档，不包含可执行代码                                  |
| `scripts/`  | 工具脚本层 | 仓库级开发脚本（bootstrap、clean、release 等）      | 不包含产品业务逻辑                                        |

---

## ⚙️ Tech Stack

- **Frontend**: React + Tauri
- **Runtime**: Python
- **Relay**: Go
- **Monorepo**: pnpm + Turborepo

---

## 🔀 Dependency Direction

```
apps/* ──→ packages/* ──→ (no upstream deps)
           ↑
services/* ─┘

skills/* ──→ skill-manifest + shared-schema (only)
```

- `apps/*` 通过网络/IPC 使用 `services/*`，通过包引用使用 `packages/*`
- `packages/*` 不依赖 `apps/*` 和 `services/*`
- `skills/*` 仅依赖 Skill Runtime SDK 和 manifest 规范

---

## 🚀 Getting Started

```bash
# 环境检查 + 安装依赖
pnpm bootstrap

# 全量启动所有子项目
pnpm dev

# 启动指定项目
pnpm dev app-shell
```

## 🧰 Scripts

| 命令                 | 说明                                                                                |
| -------------------- | ----------------------------------------------------------------------------------- |
| `pnpm bootstrap`     | 环境检查 + 依赖安装                                                                 |
| `pnpm dev`           | 全量启动所有开发进程                                                                |
| `pnpm dev <project>` | 按项目启动单个开发进程，支持 app-shell、web-console、admin-console、cli、runtime-py |
| `pnpm dev:all`       | 显式调用 Turbo 全量并行启动所有子包                                                 |
| `pnpm build`         | Turbo 全量构建                                                                      |
| `pnpm lint`          | ESLint 检查                                                                         |
| `pnpm typecheck`     | TypeScript 类型检查                                                                 |
| `pnpm format`        | Prettier 格式化                                                                     |
| `pnpm clean`         | 递归清理所有构建产物（dist / node_modules / \_\_pycache\_\_ / target 等）           |
