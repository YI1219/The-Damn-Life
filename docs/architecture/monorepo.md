# 🧱 Monorepo 结构

The Damn Life 采用 **pnpm workspace + Turborepo** 的 Monorepo 架构。

## 📐 目录拓扑

```
the-damn-life/
├── apps/                    # 用户界面层
│   ├── app-shell/           # 桌面客户端 (Tauri + React)
│   ├── web-console/         # Web 控制台 (React + Vite)
│   ├── admin-console/       # 管理后台 (React + Vite)
│   └── cli/                 # 命令行工具 (Node + tsx)
│
├── services/                # 后端服务层
│   ├── runtime-py/          # AI Runtime (Python)
│   └── relay-go/            # 中继服务 (Go)
│
├── packages/                # 共享库层 (workspace packages)
│   ├── config/              # 共享 TS/构建配置
│   ├── shared-types/        # 跨模块 TypeScript 类型
│   ├── shared-schema/       # 共享数据 Schema
│   ├── event-contracts/     # 事件契约定义
│   ├── skill-manifest/      # Skill Manifest 类型
│   ├── sdk/                 # 对外 SDK
│   └── ui/                  # 共享 UI 组件
│
├── platform/                # 平台适配层 (非 workspace)
│   ├── os/                  # OS 抽象
│   ├── hardware/            # 硬件访问
│   ├── daemon/              # 守护进程
│   ├── bridges/             # 跨语言桥接
│   ├── sandbox/             # 沙箱环境
│   ├── installers/          # 安装程序
│   └── experiments/         # 实验性模块
│
├── skills/                  # Skill 扩展层 (非 workspace)
│   ├── builtin/             # 内置 Skill
│   ├── templates/           # Skill 模板
│   └── experimental/        # 实验性 Skill
│
├── scripts/                 # 仓库级脚本 (workspace package)
├── docs/                    # 文档
└── infra/                   # 基础设施 & CI/CD
```

## 📦 Workspace 范围

`pnpm-workspace.yaml` 定义了四个 workspace 域：

| Workspace 模式 | 包含内容               | 说明                          |
| -------------- | ---------------------- | ----------------------------- |
| `apps/*`       | 所有前端/桌面/CLI 应用 | 可独立 dev/build              |
| `services/*`   | 后端服务               | 非 TS 项目仅挂载 package.json |
| `packages/*`   | 共享库                 | 被 apps/services 依赖         |
| `scripts`      | 仓库脚本               | 单一 workspace 入口           |

> `platform/`、`skills/`、`docs/`、`infra/` **不在** workspace 内，它们不参与 pnpm 包解析。

## ⚙️ 构建编排

Turborepo 负责任务编排，核心任务定义在 `turbo.json`：

| 任务        | 依赖链       | 缓存 | 说明                 |
| ----------- | ------------ | ---- | -------------------- |
| `dev`       | 无           | ❌   | 开发模式，persistent |
| `build`     | `^build`     | ✅   | 自底向上构建         |
| `typecheck` | `^typecheck` | ✅   | 类型检查             |
| `test`      | `^test`      | ✅   | 测试                 |
| `lint`      | 无           | ✅   | 代码检查             |
| `clean`     | 无           | ❌   | 清理产物             |

## 🔗 包命名约定

所有 workspace 包统一使用 `@the-damn-life/` scope：

```
@the-damn-life/app-shell
@the-damn-life/web-console
@the-damn-life/shared-types
@the-damn-life/config
...
```

## 🛠️ 工具链

| 工具       | 版本      | 用途               |
| ---------- | --------- | ------------------ |
| pnpm       | `10.28.2` | 包管理 & workspace |
| Turborepo  | `^2.9.3`  | 任务编排 & 缓存    |
| TypeScript | `^6.0.2`  | 类型系统           |
| tsx        | `^4.21.0` | 脚本执行           |
| ESLint     | `^10.1.0` | Linting            |
| Prettier   | `^3.5.3`  | 格式化             |
