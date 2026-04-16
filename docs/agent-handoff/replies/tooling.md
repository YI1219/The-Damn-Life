# Tooling / CI → Lead 回执

## 2026-04-15T19:00Z — Lead(Tooling)：lint 零噪音 + import 排序方案 spike

- **对应 Lead 指令**：from-lead.md（2026-04-16 下一轮规划）§Tooling
- **已完成**：
  - `pnpm lint` 现为 **0 errors / 0 warnings**：通过在 `eslint.config.js` 对 `scripts/**` 与 `apps/app-shell/src/bridge/host-audit.ts` 关闭 `no-console`（工具脚本与 dev fallback 允许输出）。
  - **import 排序方案 spike**：确认 `eslint-plugin-import` 的 peer 依赖仅到 ESLint 9（因此在 ESLint 10 下 `import/order` 会崩）。可选替代：
    - `eslint-plugin-import-x@4.16.2`：peer 支持 `eslint: ^8.57 || ^9 || ^10`（可迁移 `import/*` 规则族与 `order`）。
    - `eslint-plugin-simple-import-sort@13.0.0`：peer `eslint>=5`（只管排序，替代 `import/order`）。
- **未完成 / 阻塞**：暂无。下一步如需恢复排序规则，建议先选 **import-x**（兼容 ESLint 10）并小步迁移；或用 simple-import-sort 仅解决排序。
- **涉及路径或 PR**：`eslint.config.js`

（在文件 **顶部** 追加新条目；最上面为最新。）
