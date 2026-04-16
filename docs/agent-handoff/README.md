# Agent 交接协议（Lead ↔ 专项 Agent）

本目录约定 **LeadAgent 检查后如何下发指令**，以及 **专项 Agent 完成后如何回执**，便于你只需提示各方：「读协议、更新对应文件、执行下一步」。

## 文件分工

| 文件 | 谁写 | 用途 |
|------|------|------|
| [`from-lead.md`](from-lead.md) | **仅 LeadAgent** | 每次门禁/复查后更新：全局状态、按角色的下一步、阻塞项。覆盖式写入即可（保留简短「变更摘要」）。 |
| [`replies/<role>.md`](replies/) | **对应专项 Agent** | 完成一轮工作或遇阻时 **在文件顶部追加** 一条记录（见下方模板）。不要改 `from-lead.md`。 |

`<role>` 取值：`contracts` · `relay` · `runtime` · `host` · `remote-ui` · `tooling`（工具链/CI/ESLint 等无专属角色时用）。

## 专项 Agent 回执模板（复制到对应 `replies/<role>.md` 顶部）

```markdown
## YYYY-MM-DDThh:mmZ — <Agent 角色一行概括>

- **对应 Lead 指令**：from-lead.md 中 §<小节名或日期>
- **已完成**：…
- **未完成 / 阻塞**：…（无则写「无」）
- **涉及路径或 PR**：…（可选）
```

## 流程（建议你复制给所有 Agent）

1. **开工前**：读最新 [`from-lead.md`](from-lead.md）里自己角色一节；若有疑问在 `replies/<role>.md` 记阻塞并停在你能确定的范围。
2. **完工或暂停**：在 `replies/<role>.md` **顶部**追加一条回执。
3. **Lead 复查**：读各 `replies/*.md` 顶部几条 +跑门禁；重写 `from-lead.md`。

## 规则

- **单一真相**：对专项 Agent 的指令以 `from-lead.md` 为准；代码契约仍以 `packages/event-contracts` 与 `docs/protocols/` 为准。
- **少冲突**：回执只追加到自己角色的文件；Lead 只改 `from-lead.md`。
- **阶段门控**：未满足阶段 1 Done（见 `docs/roadmap/overview.md` +多 Agent 计划）前，Lead 在 `from-lead.md` 顶部写明「不启动阶段 2」。

## 与代码契约的关系

协议字段若影响线路由或载荷，须先改 **event-contracts** 与协议文档，再在 `from-lead.md` 里同步一句，避免口头与实现漂移。
