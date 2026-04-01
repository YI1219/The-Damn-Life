# CLI / API 适配器（架构说明）

## 与产品叙事的关系

目标是用 **可审计的 TaskPlan** 统一描述「对用户环境的操作」，而不是为每个桌面应用维护一套 1:1 模拟环境：

- **CLI 路径**：通过受控的 `cli_invoke` 任务类型，在审批后执行 **白名单内** 可执行文件与参数（`spawn(..., { shell: false })`），避免把任意 shell 字符串交给系统。
- **HTTP / API 路径**：抓取类需求可继续使用 `fetch_page_text`（Lightpanda 侧车）；将来若需要「仅对某 HTTPS API 发 JSON」且要进 **对用户承诺**，应新增专用 `taskType`、更新 [`mvp_scope_v1_0.md`](mvp_scope_v1_0.md) 与红队门禁，而不是在宿主中开放任意 `fetch`。

「扒第三方非公开接口」在工程上有时可行，但涉及 **服务条款、授权与稳定性**；本仓库默认不把其作为默认可交付能力，仅在合规前提下由用户自担风险扩展。

## 宿主行为摘要

| 能力 | 说明 |
|------|------|
| `DAMN_LIFE_CLI_ALLOWLIST` | 未设置时，`cli_invoke` 在 WebSocket 层 **一律拒绝**（安全默认）。逗号分隔 **可执行文件名或绝对路径**（如 `echo` 或 `/bin/echo`）。 |
| `taskType: cli_invoke` | `params.argv` 为非空字符串数组；审批前 `task.planned` 可带 `preview`（argv 摘要）。 |
| 注入防护 | 参数中禁止常见 shell 元字符与换行；参数个数与长度有上限（见 [`host/src/cliInvokePolicy.ts`](../host/src/cliInvokePolicy.ts)）。 |

## 自然语言入口（规则规划）

示例（需同时配置 allowlist，且命令在 PATH 上可用）：

- `执行CLI echo hello`
- `cli invoke date`

空格分词为 argv；**参数内空格** 当前未做引号解析，后续可迭代。

## 若将本能力纳入「对用户承诺」

须修订 [`mvp_scope_v1_0.md`](mvp_scope_v1_0.md) In Scope、补充 e2e/红队用例，并与 [`project_plan_v1_4.md`](../project_plan/project_plan_v1_4.md) 里程碑对齐。
