# 契约版本策略（MVP）

本文档说明 `packages/event-contracts` 与 WebSocket 载荷的 **版本化规则**，供 Lead 冻结与跨语言实现对齐。

## 版本号

- **Bundle 版本**：与 npm 包版本独立；在代码中为 `CONTRACT_VERSION`（当前 `0.1.0`），并写入每条消息的 `contractVersion` 字段。
- **语义**：遵循 [SemVer 2.0](https://semver.org/lang/zh-CN/) 的意图：
  - **MAJOR**：不兼容的载荷或事件重命名；消费者须显式升级或并行支持旧 major。
  - **MINOR**：仅新增可选字段、新事件类型或向后兼容扩展。
  - **PATCH**：文档澄清、注释、与实现无涉的约定修正（仍建议同步 PATCH以追踪文档修订）。

## 单一写入源

- **TypeScript 类型与事件枚举**：`packages/event-contracts` 为规范源；Go/Python 实现应对照同名 `type` 与 `payload` 字段。
- **人读摘要**：`docs/protocols/websocket-events.md` 必须与上述包一致；冲突时以 **先改 TS 包再改文档** 为准。

## 冻结流程（Lead）

1. ContractsAgent 提出 `CONTRACT_VERSION` 与事件表变更说明。
2. Lead 在阶段 1 内 **冻结** 当前 minor（远程、中继、Runtime、Host 按同一版本联调）。
3. 冻结后 MINOR 新增须标注「可选」字段并在中继侧保持 **透传**（不解析业务 payload）。

## 接收方行为

- **未知 `type`**：记录并忽略或返回 `system.error`（由实现选择；须可审计）。
- **更高 MINOR的 `contractVersion`**：允许解析已知字段，忽略未知字段。
- **更高 MAJOR**：不得静默兼容；应拒绝或进入协商流程（后续版本定义）。
