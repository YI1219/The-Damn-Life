# 🔀 依赖规则

模块间的依赖方向与访问权限约束。

## 📏 核心原则

**依赖只能向下流动，不可反向。**

```
┌─────────────────────────────────────────┐
│  apps/         (UI 层)                  │  可依赖 ▼
├─────────────────────────────────────────┤
│  services/     (服务层)                 │  可依赖 ▼
├─────────────────────────────────────────┤
│  packages/     (共享库层)               │  可依赖 ▼
├─────────────────────────────────────────┤
│  platform/     (平台层)                 │  最底层
└─────────────────────────────────────────┘
```

## 🚦 依赖矩阵

| 来源 ↓ → 目标 | packages/ | apps/ | services/ | platform/ | skills/ |
| ------------- | --------- | ----- | --------- | --------- | ------- |
| **apps/**     | ✅        | ❌    | ❌        | ❌        | ❌      |
| **services/** | ✅        | ❌    | ❌        | ❌        | ❌      |
| **packages/** | ✅ 同层   | ❌    | ❌        | ❌        | ❌      |
| **platform/** | ❌        | ❌    | ❌        | ✅ 同层   | ❌      |
| **skills/**   | ❌        | ❌    | ❌        | ❌        | ❌      |
| **scripts/**  | ✅        | ❌    | ❌        | ❌        | ❌      |

## 📌 具体规则

### 1. apps → packages ✅

应用只能依赖 `packages/` 下的共享库：

```
apps/web-console → @the-damn-life/shared-types   ✅
apps/web-console → @the-damn-life/ui              ✅
apps/web-console → apps/admin-console             ❌ 禁止
```

### 2. apps 之间 ❌

应用之间**严禁互相依赖**。共享逻辑必须下沉到 `packages/`。

### 3. services → packages ✅

服务可以依赖 `packages/` 获取类型定义、Schema 等，但不能依赖 apps。

### 4. packages 同层 ✅（有约束）

共享库之间可以互相依赖，但须避免循环引用：

```
packages/sdk → packages/shared-types              ✅
packages/shared-types → packages/sdk              ❌ 循环
```

### 5. platform 隔离

`platform/` 不在 pnpm workspace 内，不能被 TS 包直接 import。通信必须经过 Bridge 层（Tauri Command / IPC）。

### 6. skills 沙箱化

`skills/` 运行在沙箱中，不能直接依赖任何 workspace 包。Skill 只能通过 Runtime 提供的 API 接口与系统交互。

## 🔍 共享配置依赖

所有 TypeScript workspace 包共享 `@the-damn-life/config` 的基础配置：

```
packages/config/tsconfig.base.json   ← 所有 TS 包 extends
packages/config/tsconfig.react.json  ← React 应用 extends
```

每个 TS 包的 `package.json` 须声明：

```json
{
  "devDependencies": {
    "@the-damn-life/config": "workspace:*"
  }
}
```

## ⚠️ 违规检测

目前依赖规则通过 Code Review 人工保证。后续可引入：

- `eslint-plugin-import` 的 `no-restricted-paths` 规则
- Turborepo 的 `dependsOn` 约束
- CI 阶段的依赖图校验脚本
