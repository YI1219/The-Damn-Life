# AI Vibe Coding 工程化规范

> 本文档面向所有参与 The Damn Life 项目的 AI 编码助手（Copilot / Cursor / Claude 等）及人类开发者。
> 目标：**确保 AI 生成的代码符合本仓库的工程标准，避免 vibe coding 带来的技术债**。

---

## 目录

1. [通用原则](#1-通用原则)
2. [TypeScript / JavaScript 规范](#2-typescriptjavascript-规范)
3. [Python 规范](#3-python-规范)
4. [Go 规范](#4-go-规范)
5. [Rust 规范](#5-rust-规范)
6. [安全规范](#6-安全规范)
7. [架构与可靠性](#7-架构与可靠性)
8. [代码质量与可维护性](#8-代码质量与可维护性)
9. [测试规范](#9-测试规范)
10. [跨语言协议与契约](#10-跨语言协议与契约)
11. [Git 与协作规范](#11-git-与协作规范)
12. [AI 编码特别注意事项](#12-ai-编码特别注意事项)

---

## 1. 通用原则

### 1.1 项目核心原则（必须遵守）

- **本地优先** — 数据与计算默认留在本地，远程仅作补充
- **显式权限** — 任何系统能力访问都需显式授权，绝不静默获取
- **强隔离** — Skill、Runtime、宿主之间严格沙箱隔离
- **事件驱动** — 模块间通过事件协议通信，松耦合

### 1.2 EditorConfig 基线

本仓库根目录 `.editorconfig` 定义所有文件的底层格式：

| 规则                      | 值                   |
| ------------------------- | -------------------- |
| charset                   | `utf-8`              |
| end_of_line               | `lf`                 |
| insert_final_newline      | `true`               |
| indent_style              | `space`              |
| indent_size (默认)        | `2`                  |
| indent_size (`.rs`)       | `4`                  |
| indent_size (`.py`)       | `4`                  |
| indent_style (`Makefile`) | `tab`                |
| trim_trailing_whitespace  | `true`（`.md` 除外） |

**AI 生成代码必须遵循以上缩进和换行规则，不可使用 CRLF。**

### 1.3 依赖方向（铁律）

```
apps/* ──→ packages/* ──→ (无上游依赖)
              ↑
services/* ───┘

skills/* ──→ skill-manifest + shared-schema (仅此)
```

- `apps/*` 之间 **严禁互相依赖**；共享逻辑必须下沉到 `packages/`
- `services/*` 只能依赖 `packages/*`，不能依赖 `apps/*`
- `packages/*` 同层可依赖，但 **禁止循环引用**
- `platform/` 不在 workspace 内，通信必须经过 Bridge 层（Tauri Command / IPC）
- `skills/*` 运行在沙箱中，不能直接依赖任何 workspace 包

### 1.4 包命名约定

所有 workspace 包统一使用 `@the-damn-life/` scope，ESM 模块格式（`"type": "module"`）。

---

## 2. TypeScript / JavaScript 规范

### 2.1 Prettier（格式化规范源）

本仓库 `.prettierrc` 为格式化的 **单一真相来源**，AI 生成的所有 TS/JS/TSX/JSX 代码必须符合：

| 规则              | 值          | 说明                        |
| ----------------- | ----------- | --------------------------- |
| `printWidth`      | `100`       | 每行最大宽度                |
| `tabWidth`        | `2`         | 缩进宽度                    |
| `useTabs`         | `false`     | 使用空格                    |
| `semi`            | `false`     | **不使用分号**              |
| `singleQuote`     | `true`      | 字符串用单引号              |
| `quoteProps`      | `as-needed` | 按需引用属性名              |
| `trailingComma`   | `all`       | 所有位置尾逗号              |
| `bracketSpacing`  | `true`      | `{ a }` 而非 `{a}`          |
| `bracketSameLine` | `false`     | JSX 闭合标签换行            |
| `arrowParens`     | `always`    | 箭头函数始终加括号 `(x) =>` |
| `endOfLine`       | `lf`        | Unix 换行                   |
| `jsxSingleQuote`  | `false`     | JSX 属性用双引号            |

**关键：不加分号，用单引号，尾逗号必须有。**

### 2.2 ESLint 规则摘要

基于 `eslint.config.js`，AI 代码必须满足：

**通用 JS/TS：**

- `no-var: error` — 禁止 `var`，使用 `const` / `let`
- `prefer-const: error` — 不重新赋值的变量必须用 `const`
- `eqeqeq: always` — 严格相等 `===`，禁止 `==`
- `curly: all` — 所有 `if` / `else` / `for` / `while` 必须用花括号
- `no-console: warn` — 仅允许 `console.warn` 和 `console.error`（`scripts/` 除外）
- `no-debugger: warn` — 不提交 `debugger`

**TypeScript 特定：**

- `@typescript-eslint/no-explicit-any: warn` — 尽量避免 `any`，必要时加注释说明
- `@typescript-eslint/no-unused-vars: error` — 未使用变量必须删除，或以 `_` 前缀命名
- `@typescript-eslint/consistent-type-imports: error` — **必须使用 `type` 导入**：

  ```ts
  // ✅ 正确
  import type { Foo } from './foo'
  import { type Bar, baz } from './bar'

  // ❌ 错误
  import { Foo } from './foo' // Foo 仅用于类型
  ```

**React 特定：**

- `react/react-in-jsx-scope: off` — React 19 无需导入 React
- `react/prop-types: off` — 使用 TypeScript 类型，不使用 PropTypes
- `react/jsx-boolean-value: error` — `<Comp disabled>` 而非 `<Comp disabled={true}>`
- `react/self-closing-comp: error` — 无子元素的组件必须自闭合 `<Comp />`
- React Hooks 规则 — 必须遵守 hooks 调用规则

**Import 顺序：**

- `import/first: error` — import 语句必须在文件最前面
- `import/newline-after-import: error` — import 块后空一行
- `import/no-duplicates: error` — 禁止重复 import 同一模块

### 2.3 TypeScript 编译配置

基于 `packages/config/tsconfig.base.json`：

| 选项                         | 值        | AI 须知                                 |
| ---------------------------- | --------- | --------------------------------------- |
| `target`                     | `ES2022`  | 可用 top-level await、private fields 等 |
| `module`                     | `ESNext`  | 纯 ESM，不用 CommonJS                   |
| `moduleResolution`           | `bundler` | import 路径遵循 bundler 解析            |
| `strict`                     | `true`    | 严格模式全开                            |
| `noImplicitOverride`         | `true`    | 重写方法必须显式 `override`             |
| `noUncheckedIndexedAccess`   | `true`    | 索引访问结果为 `T \| undefined`         |
| `noFallthroughCasesInSwitch` | `true`    | switch 必须 break/return                |
| `isolatedModules`            | `true`    | 每个文件独立编译                        |

**React 应用** 额外继承 `tsconfig.react.json`：`jsx: react-jsx`，lib 包含 `DOM`。

### 2.4 代码风格要求

```ts
// ✅ 函数签名：显式返回类型（公共 API 和导出函数）
export function parseMessage(raw: string): ParseResult {
  // ...
}

// ✅ 类型优先：用 interface 定义公共契约，type 用于联合/交叉/工具类型
export interface SessionConfig {
  relayUrl: string
  workspaceId?: string
}

// ✅ 错误处理：用具体类型，不用 any
try {
  await connect(url)
} catch (e: unknown) {
  const msg = e instanceof Error ? e.message : String(e)
  handleError(msg)
}

// ✅ 可选链和空值合并
const name = user?.profile?.name ?? 'anonymous'

// ❌ 禁止：裸 innerHTML（XSS 风险）
element.innerHTML = userInput // 绝对禁止

// ✅ 安全替代
element.textContent = userInput
```

---

## 3. Python 规范

### 3.1 版本与项目配置

- Python `≥ 3.11`
- 构建系统：`hatchling`（见 `pyproject.toml`）
- 测试框架：`pytest ≥ 8.0`

### 3.2 格式与风格

| 规则       | 值                                               |
| ---------- | ------------------------------------------------ |
| 缩进       | 4 空格（`.editorconfig`）                        |
| 行宽       | 100 字符（与 TS 一致）                           |
| 字符串引号 | 双引号（Python 惯例）                            |
| 换行       | LF                                               |
| 类型注解   | 必须使用（`from __future__ import annotations`） |

**代码风格遵循 PEP 8，强烈建议通过 `ruff` 格式化。**

### 3.3 类型注解要求

```python
from __future__ import annotations

from typing import Any

# ✅ 函数签名必须有类型注解
def handle_message(self, msg: dict[str, Any]) -> None:
    ...

# ✅ 使用现代语法（3.11+）
def get_items(ids: list[str]) -> dict[str, Item | None]:
    ...

# ❌ 禁止不带类型的公共函数
def process(data):  # 缺少类型注解
    ...
```

### 3.4 命名约定

| 类别      | 风格               | 示例                |
| --------- | ------------------ | ------------------- |
| 模块      | `snake_case`       | `runtime_core.py`   |
| 函数/方法 | `snake_case`       | `handle_message()`  |
| 类        | `PascalCase`       | `TaskRuntime`       |
| 常量      | `UPPER_SNAKE_CASE` | `CONTRACT_VERSION`  |
| 私有方法  | `_snake_case`      | `_on_task_submit()` |
| 类型变量  | `PascalCase`       | `EmitFn`            |

### 3.5 异常处理

```python
# ✅ 捕获具体异常
try:
    result = skill.invoke(ctx)
except SkillNotFoundError as e:
    logger.error('skill not found: %s', e)
except Exception as exc:  # noqa: BLE001 — 仅在任务边界使用
    logger.error('unexpected: %s', exc)

# ❌ 禁止裸 except
try:
    ...
except:
    pass
```

### 3.6 导入顺序

```python
# 1. 标准库
import json
import os
from typing import Any

# 2. 第三方库
import pytest

# 3. 本地模块
from src.runtime_core import TaskRuntime
from src.wire import envelope
```

---

## 4. Go 规范

### 4.1 版本与工具链

- Go `≥ 1.22`
- 模块路径：`github.com/YI1219/The-Damn-Life/services/relay-go`
- 构建：`go build ./cmd/relay`

### 4.2 格式与风格

| 规则   | 值                                  |
| ------ | ----------------------------------- |
| 格式化 | **`gofmt`** / `goimports`（非可选） |
| 缩进   | Tab（Go 标准）                      |
| 行宽   | 无硬性限制，建议 100 字符           |
| 换行   | LF                                  |

**所有 Go 代码必须通过 `gofmt` 格式化，不接受非标准格式。**

### 4.3 命名约定

| 类别          | 风格                                       | 示例                        |
| ------------- | ------------------------------------------ | --------------------------- |
| 包名          | 小写单词                                   | `hub`, `role`, `ws`         |
| 导出函数/类型 | `PascalCase`                               | `NewClient()`, `Hub`        |
| 非导出        | `camelCase`                                | `debugf()`, `sessionBucket` |
| 常量          | `PascalCase` (导出) / `camelCase` (非导出) | `Remote`, `maxMessageSize`  |
| 接口          | `-er` 后缀（惯例）                         | `Reader`, `Handler`         |

### 4.4 错误处理

```go
// ✅ 显式检查和返回错误
conn, err := upgrader.Upgrade(w, r, nil)
if err != nil {
    log.Printf("ws upgrade: %v", err)
    return
}

// ✅ 用 fmt.Errorf 包装上下文
return fmt.Errorf("parse role %q: %w", s, err)

// ❌ 禁止忽略错误（必须显式处理或以 _ 接收并注释原因）
result, _ := someCall()  // 需要注释为什么忽略
```

### 4.5 并发安全

```go
// ✅ 使用 sync.Mutex / sync.RWMutex 保护共享状态
type Hub struct {
    mu       sync.RWMutex
    sessions map[string]*Session
}

// ✅ 使用 sync.Once 保证一次性操作
func (c *Client) ShutdownSend() {
    c.sendOnce.Do(func() {
        close(c.send)
    })
}

// ❌ 禁止无保护的并发 map 读写
```

### 4.6 包结构

```
services/relay-go/
├── cmd/relay/main.go       # 入口，配置解析，HTTP 路由
└── internal/               # 非导出包
    ├── hub/                # 业务核心（session/client 管理）
    ├── role/               # 角色解析
    └── ws/                 # WebSocket 处理
```

- `internal/` 强制封装，禁止外部引用
- `cmd/` 仅做配置解析和启动接线，不放业务逻辑

---

## 5. Rust 规范

### 5.1 版本与工具链

- Edition：`2021`
- 用途：Tauri 桌面壳（`apps/app-shell/src-tauri/`）
- 构建：`cargo build` / `cargo tauri build`

### 5.2 格式与风格

| 规则   | 值                        |
| ------ | ------------------------- |
| 格式化 | **`rustfmt`**（非可选）   |
| 缩进   | 4 空格（`.editorconfig`） |
| 换行   | LF                        |

**所有 Rust 代码必须通过 `rustfmt` 格式化。**

### 5.3 要求

```rust
// ✅ 使用 Result 和 ? 操作符处理错误
fn audit_log_path() -> Result<std::path::PathBuf, String> {
    let dirs = directories::ProjectDirs::from("com", "the-damn-life", "desktop")
        .ok_or_else(|| "could not resolve app data dir".to_string())?;
    Ok(dirs.data_dir().join("host-audit.ndjson"))
}

// ✅ Tauri command 必须返回 Result
#[tauri::command]
fn my_command(input: String) -> Result<String, String> {
    // ...
}

// ❌ 禁止 unwrap() 在生产代码中（仅测试可用）
let value = risky_call().unwrap();  // 生产代码禁止
```

### 5.4 安全要求

- Tauri Command 的输入必须做校验（类型、长度、路径遍历）
- 文件操作必须限制在应用数据目录内
- 使用 `#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]` 隐藏生产环境控制台

---

## 6. 安全规范

### 6.1 核心安全原则

基于 `docs/security/README.md` 和项目核心原则：

- **显式权限** — 任何出站连接、文件访问、系统操作都需用户确认
- **最小权限** — 每个组件只请求必要的权限
- **可审计** — 所有操作均可追溯（`audit.record` 事件 + 本地日志）
- **强隔离** — Skill / Runtime / 宿主之间严格沙箱

### 6.2 OWASP Top 10 对照（必须遵守）

| 威胁                  | 本项目要求                                                                         |
| --------------------- | ---------------------------------------------------------------------------------- |
| **注入（Injection）** | 禁止 `innerHTML` 拼接用户输入；SQL/命令拼接必须参数化                              |
| **认证失效**          | WebSocket 连接必须有 token/secret 验证（不能仅靠 session ID）                      |
| **敏感数据暴露**      | 日志禁止记录密钥/token；`skill.invoked` 仅 `argsDigest`，禁止明文                  |
| **XXE**               | JSON 交互无此风险；如引入 XML 解析必须禁用外部实体                                 |
| **访问控制**          | Relay/Sync/Runtime 的 HTTP 端点必须有认证机制                                      |
| **安全配置错误**      | CORS 生产环境 **禁止** `*`，必须明确 Origin 白名单                                 |
| **XSS**               | DOM 操作必须使用 `textContent`；React JSX 自动转义，不用 `dangerouslySetInnerHTML` |
| **反序列化**          | JSON.parse 后必须校验结构，不可直接 `as unknown as T` 信任                         |
| **已知漏洞组件**      | 定期 `pnpm audit` / `go mod tidy` / `cargo audit`                                  |
| **日志与监控**        | 安全相关事件必须记录到审计日志                                                     |

### 6.3 具体安全红线

#### 6.3.1 禁止裸 innerHTML

```ts
// ❌ 绝对禁止
element.innerHTML = `<div>${userInput}</div>`

// ✅ 安全做法
element.textContent = userInput
// 或使用 React JSX（自动转义）
```

#### 6.3.2 CORS 配置

```ts
// ❌ 生产环境禁止
cors(res, '*')

// ✅ 明确白名单
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') ?? []
```

#### 6.3.3 认证要求

- **Relay WebSocket** — 必须验证连接 token（不能仅靠 URL 中的 session ID）
- **Sync Service** — POST 写入接口必须有认证
- **Runtime HTTP bridge** — 绑定 `127.0.0.1` 且仅限开发环境使用

#### 6.3.4 网络输入校验

```ts
// ❌ 不安全的类型断言
const msg = JSON.parse(raw) as WsMessage // 信任网络数据

// ✅ 运行时校验
const parsed = JSON.parse(raw)
if (!parsed || typeof parsed !== 'object') throw new Error('invalid')
if (typeof parsed.type !== 'string' || !isEventType(parsed.type)) throw new Error('unknown type')
// 然后进一步校验 payload 结构
```

#### 6.3.5 路径安全

```rust
// ❌ 不安全：用户输入拼接路径
let path = format!("/data/{}", user_input);

// ✅ 安全：限制在应用目录内
let dirs = ProjectDirs::from("com", "the-damn-life", "desktop").unwrap();
let safe_path = dirs.data_dir().join(sanitized_filename);
```

#### 6.3.6 密钥处理

- 密钥通过环境变量注入，**绝不硬编码**
- 日志中**绝不打印** token、密码、API key
- `argsDigest` 使用哈希摘要，不传原文

---

## 7. 架构与可靠性

### 7.1 模块职责边界

基于各模块 README 中的 Boundaries 定义：

| 模块              | 做什么                      | 不做什么                                                |
| ----------------- | --------------------------- | ------------------------------------------------------- |
| `app-shell`       | 桌面 UI、权限审批、本地配置 | 不做 AI 编排、不做中继                                  |
| `web-console`     | 远程查看/控制、审批         | 不做本地系统调用、不做 AI 编排                          |
| `relay-go`        | 会话桥接、指令转发          | 不做业务编排、不做数据存储、**不解析 payload 业务语义** |
| `runtime-py`      | AI 编排、Skill 调度         | 不做 UI、不做中继、不直接获取宿主最高权限               |
| `sync-service`    | 事件存储、历史查询          | 不做编排、不做中继                                      |
| `event-contracts` | 事件类型/payload 定义       | 不承载业务逻辑                                          |

**AI 在某个模块内生成代码时，必须遵守该模块的 Boundaries。**

### 7.2 可靠性要求

#### 资源管理

```go
// ✅ 连接/会话必须有超时和清理机制
// Hub 中的 session 必须有 TTL（idle timeout）
// WebSocket 必须有 pong/ping 保活和读写超时

// ❌ 禁止无限期持有资源
sessions map[string]*Session  // 无 TTL = 内存泄露
```

#### 优雅降级

```ts
// ✅ Best-effort 操作失败不应阻塞主链路
try {
  await mirrorToSyncService(envelope)
} catch {
  // 记录但不阻塞
  console.warn('mirror failed, continuing')
}

// ❌ 辅助功能不应 throw 影响主流程
await mirrorToSyncService(envelope) // 如果失败则整个流程中断
```

#### 重连机制

- WebSocket 连接必须实现 **指数退避重连**（exponential backoff）
- 断线重连时应恢复会话状态而非重建
- 重连间隔建议：1s → 2s → 4s → 8s → 16s → 30s（cap）

#### 并发安全

- Go：共享状态必须用 `sync.Mutex` / `sync.RWMutex` 保护
- Python：HTTP 服务必须支持并发请求（使用 `asyncio` 或多线程 server）
- TypeScript：避免竞态条件，特别是 WebSocket 消息处理中的状态更新

### 7.3 服务自省

每个服务必须提供：

- `GET /health` — 健康检查（返回 `{"status": "ok"}`）
- 结构化日志（至少包含 timestamp、level、module）
- 启动时打印绑定地址和关键配置（到 stderr）

---

## 8. 代码质量与可维护性

### 8.1 文件大小

| 语言             | 单文件行数上限 | 超出时应            |
| ---------------- | -------------- | ------------------- |
| TypeScript/React | **400 行**     | 拆分为子组件/子模块 |
| Python           | **300 行**     | 拆分为子模块        |
| Go               | **400 行**     | 拆分为子包或文件    |
| Rust             | **300 行**     | 拆分为子模块        |

**AI 生成超过上限的单文件代码时必须主动拆分。**

### 8.2 函数/方法大小

- 单个函数不超过 **50 行**（不含空行和注释）
- 超过时必须提取子函数
- 一个函数只做一件事

### 8.3 React 组件规范

```tsx
// ✅ 组件拆分原则
// - 单个组件文件不超过 200 行
// - 复杂状态逻辑提取到自定义 hook
// - 事件处理逻辑超过 10 行的提取为函数
// - 重复模式用 reducer 或状态机替代 if-else 链

// ✅ 自定义 Hook 命名
function useRelaySession() { ... }  // use 前缀

// ✅ 组件命名
export function TaskPanel() { ... }  // PascalCase，函数组件

// ❌ 禁止超级组件
// 一个 1000+ 行的 App.tsx 包含所有面板 — 必须拆分
```

### 8.4 状态管理

```ts
// ✅ 重复的 if-else 分支 → 使用 reducer 或事件处理表
const EVENT_HANDLERS: Record<EventType, (payload: unknown) => void> = {
  'task.accepted': handleTaskAccepted,
  'task.started': handleTaskStarted,
  'task.progress': handleTaskProgress,
  // ...
}

// ❌ 禁止 15+ 个 if (type === 'xxx') 链
if (type === 'task.accepted') { ... }
else if (type === 'task.started') { ... }
// ... 重复 15 次
```

### 8.5 命名规范

| 场景     | 好名字                                    | 坏名字                    |
| -------- | ----------------------------------------- | ------------------------- |
| 布尔变量 | `isConnected`, `hasError`                 | `flag`, `state`           |
| 函数     | `parseEnvelope()`, `connectRelay()`       | `do()`, `process()`       |
| 事件处理 | `onSessionJoined()`, `handleTaskSubmit()` | `callback()`, `handler()` |
| 常量     | `MAX_RETRY_COUNT`, `DEFAULT_RELAY_PORT`   | `N`, `PORT`               |

### 8.6 注释规范

```ts
// ✅ 解释 WHY（为什么这么做），而不是 WHAT（做了什么）
// Relay 透传 payload 不做解析，因此协议升级对 Relay 零改动
c.Hub().Forward(c, message)

// ✅ TODO 必须关联上下文
// TODO(phase3): 替换内存 EventStore 为持久化存储（SQLite 或 PostgreSQL）

// ❌ 不要写无用的注释
// 增加一个数字（显而易见）
count += 1
```

### 8.7 错误处理

- **系统边界**（网络输入、文件 IO、外部调用）：必须校验和处理错误
- **内部调用**：类型系统保证正确时可以不做冗余校验
- **静默吞异常**：禁止在 catch 块中什么都不做；至少记录日志
- **错误信息**：必须包含上下文（什么操作失败了、输入是什么）

```ts
// ❌ 禁止
try { ... } catch { /* ignore */ }

// ✅ 至少记录
try { ... } catch (e: unknown) {
  console.warn('mirror POST failed:', e instanceof Error ? e.message : e)
}
```

---

## 9. 测试规范

### 9.1 测试框架

| 语言       | 框架                     | 运行命令                                    |
| ---------- | ------------------------ | ------------------------------------------- |
| TypeScript | `node:test`（Node 内置） | `node --import tsx --test src/**/*.test.ts` |
| Python     | `pytest ≥ 8.0`           | `pytest`                                    |
| Go         | `testing`（标准库）      | `go test ./...`                             |
| Rust       | `#[cfg(test)]`（标准库） | `cargo test`                                |

### 9.2 测试文件命名

| 语言       | 命名                              | 示例                 |
| ---------- | --------------------------------- | -------------------- |
| TypeScript | `*.test.ts`                       | `eventStore.test.ts` |
| Python     | `test_*.py`                       | `test_main.py`       |
| Go         | `*_test.go`                       | `envelope_test.go`   |
| Rust       | 同文件 `#[cfg(test)]` 或 `tests/` | —                    |

### 9.3 测试覆盖要求

**新代码必须附带测试。** 最低要求：

| 类别                | 覆盖要求                                               |
| ------------------- | ------------------------------------------------------ |
| 公共 API / 导出函数 | **必须有**单元测试                                     |
| 核心业务逻辑        | **必须有**单元测试（happy path + 至少一个 error path） |
| 网络协议处理        | **必须有**信封解析/校验测试                            |
| 状态机 / 生命周期   | **必须有**状态转换测试                                 |
| 辅助工具函数        | 建议有                                                 |
| UI 组件             | 建议有（至少渲染测试）                                 |

### 9.4 测试编写规范

```ts
// ✅ 好的测试：描述行为，不描述实现
test('EventStore.query returns events newer than sinceSeq for workspace', () => {
  const store = new EventStore(100)
  store.append({ workspaceId: 'ws-1', source: 'test', envelope: { type: 'a' } })
  const rows = store.query('ws-1', 0, 50)
  assert.equal(rows.length, 1)
})

// ✅ 测试 error path
test('parseWsText returns error for invalid JSON', () => {
  const result = parseWsText('not json')
  assert.equal(result.ok, false)
})

// ❌ 禁止无断言的测试
test('does something', () => {
  doSomething() // 没有 assert
})
```

```python
# ✅ 好的 Python 测试
def test_task_submit_happy_path():
    events: list[dict] = []
    rt = TaskRuntime(emit=events.append)
    rt.submit_task(intent="do thing", trace_id="trace-1")
    types = [e["type"] for e in events]
    assert "task.accepted" in types
    assert "task.completed" in types

# ✅ 测试异常路径
def test_unknown_skill_returns_failure():
    events: list[dict] = []
    rt = TaskRuntime(emit=events.append)
    rt.submit_task(intent="x", trace_id="t", skill_id="nonexistent")
    failed = [e for e in events if e["type"] == "skill.failed"]
    assert len(failed) == 1
    assert failed[0]["payload"]["code"] == "skill.unknown"
```

### 9.5 E2E 与集成测试

- `scripts/e2e-smoke.ts` — 四口端到端冒烟（Relay + Runtime + Host + Remote）
- `scripts/sync-history-smoke.ts` — 离线回线冒烟
- E2E 测试应在 CI 中运行（目前仅本地可用，应纳入 CI）

---

## 10. 跨语言协议与契约

### 10.1 单一事实来源

**`packages/event-contracts`** 是所有事件类型和 payload 结构的规范源。

| 规范文件      | 内容                                      |
| ------------- | ----------------------------------------- |
| `version.ts`  | `CONTRACT_VERSION`（当前 `0.1.0`）        |
| `envelope.ts` | `WireEnvelopeBase` 信封结构               |
| `messages.ts` | `EVENT_TYPES` 枚举 + `WsMessage` 判别联合 |
| `payloads.ts` | 每种事件的 payload 类型                   |
| `ids.ts`      | ID 类型别名                               |

### 10.2 跨语言对齐规则

| 规则         | 说明                                                                 |
| ------------ | -------------------------------------------------------------------- |
| 字段名       | 必须 **camelCase**（JSON 序列化后一致）                              |
| 事件名       | 必须与 `EVENT_TYPES` 数组完全一致（`task.submit` 不是 `taskSubmit`） |
| 版本号       | 所有语言的 `CONTRACT_VERSION` 必须同步                               |
| 必填 vs 可选 | 与 TypeScript 类型定义一致（`?` = 可选 = JSON 可省略）               |

### 10.3 版本号维护

`CONTRACT_VERSION` 当前在三处独立定义：

1. `packages/event-contracts/src/version.ts` — **规范源**
2. `services/runtime-py/src/wire.py` — Python 侧
3. `services/relay-go/internal/ws/envelope.go` — Go 侧（fallback 值）

**修改契约版本时，上述三处必须同步更新。**

建议：

- 引入 JSON Schema 或 Protobuf 作为生成源
- CI 中加入版本一致性检查脚本

### 10.4 新增事件类型的流程

1. 在 `packages/event-contracts/src/payloads.ts` 定义 payload 类型
2. 在 `packages/event-contracts/src/messages.ts` 添加到 `EVENT_TYPES` 和 `WsMessage` 联合
3. 更新 `docs/protocols/websocket-events.md` 的事件表
4. 在 Python/Go 实现中同步添加对应处理
5. 编写测试覆盖新事件的序列化/反序列化

---

## 11. Git 与协作规范

### 11.1 分支命名

| 前缀        | 用途   | 示例                            |
| ----------- | ------ | ------------------------------- |
| `feat/`     | 新功能 | `feat/phase2-sync-relay`        |
| `fix/`      | 修复   | `fix/ws-reconnect`              |
| `chore/`    | 杂务   | `chore/init-project`            |
| `docs/`     | 文档   | `docs/vibe-coding-guide`        |
| `refactor/` | 重构   | `refactor/split-app-components` |

### 11.2 Commit Message

```
<type>(<scope>): <subject>

<body>

<footer>
```

**type**: `feat` | `fix` | `docs` | `chore` | `refactor` | `test` | `ci`
**scope**: 模块名（如 `relay-go`, `web-console`, `event-contracts`）

```
feat(relay-go): add session TTL and idle cleanup

Sessions now expire after 30 minutes of inactivity.
The Hub runs a background goroutine to sweep expired sessions.

Closes #42
```

### 11.3 PR 要求

- 每个 PR 聚焦单一变更（不混合功能和重构）
- 必须通过 CI（typecheck + lint + build + test）
- 新功能必须附带测试
- 跨模块变更需在 PR 描述中说明影响范围

---

## 12. AI 编码特别注意事项

### 12.1 AI 生成代码的常见陷阱

| 陷阱                       | 正确做法                               |
| -------------------------- | -------------------------------------- |
| 生成巨型单文件（1000+ 行） | 按职责拆分，遵守文件大小限制           |
| `any` 满天飞               | 使用具体类型；必要的 `any` 加注释      |
| `innerHTML` 拼接           | 使用 `textContent` 或 React JSX        |
| 忽略错误 `catch {}`        | 至少 `console.warn`；安全相关必须记录  |
| CORS `*` 直接用于生产      | 按环境配置 Origin 白名单               |
| 同步阻塞调用               | 服务端用 async I/O；长任务不阻塞主线程 |
| 缺少测试                   | 每个新功能至少 happy path + error path |
| `as unknown as T` 强转     | 运行时校验后再断言                     |
| 重复代码（copy-paste）     | 提取为共享函数 / 查表                  |
| 硬编码配置                 | 使用环境变量 + 合理默认值              |

### 12.2 AI 生成代码的审查清单

在提交 AI 生成的代码前，确认以下各项：

- [ ] **格式** — 通过 `pnpm format`（Prettier）和 `pnpm lint`（ESLint）
- [ ] **类型** — 通过 `pnpm typecheck`（TypeScript 严格模式）
- [ ] **安全** — 无 innerHTML、无 CORS `*`（生产）、无硬编码密钥
- [ ] **边界** — 代码放在正确的模块中，遵守依赖方向
- [ ] **测试** — 新功能有测试，跑通 `pnpm test`
- [ ] **大小** — 单文件不超限，函数不超 50 行
- [ ] **命名** — 遵循各语言命名规范，语义清晰
- [ ] **错误** — 边界处有校验，catch 块有处理
- [ ] **协议** — 新事件同步更新 TS 类型 + 文档 + 其他语言实现
- [ ] **文档** — 公共 API 有 JSDoc/docstring；复杂逻辑有注释解释 WHY

### 12.3 对 AI 助手的指令

当你为本项目生成代码时：

1. **先读配置** — 检查 `.prettierrc`、`eslint.config.js`、`tsconfig.json` 确认格式和类型要求
2. **先读 README** — 检查目标模块的 README.md 确认职责边界
3. **先读契约** — 修改事件相关代码前检查 `packages/event-contracts`
4. **不要过度工程** — 只做被要求的事，不自作主张加功能
5. **不要静默忽略错误** — 最少也要 log
6. **不要跳过测试** — 新功能必须有测试
7. **不要使用 innerHTML** — 永远不要
8. **不要信任网络输入** — 必须运行时校验

---

## 相关文档

- [`docs/architecture/`](architecture/) — 架构设计
- [`docs/architecture/dependency-rules.md`](architecture/dependency-rules.md) — 模块间依赖规则
- [`docs/protocols/websocket-events.md`](protocols/websocket-events.md) — WebSocket 事件协议
- [`docs/protocols/versioning.md`](protocols/versioning.md) — 契约版本策略
- [`docs/development/bootstrap.md`](development/bootstrap.md) — 环境搭建
- [`docs/security/README.md`](security/README.md) — 安全策略
- [`docs/roadmap/`](roadmap/) — 路线图
