# Backlog（技术债 & 待定项）

> 只记录“需要被追踪”的事项；不替代 issue tracker。  
> 阶段 2 开始前，本文件以“规划级拆解”为主。

## 阶段 1 收尾（已签-off但建议尽快做）

- **Python 版本一致性**：`runtime-py` 标注 `>=3.11`，当前机器可能仍在用系统 Python 3.9 跑部分脚本；建议统一到 `python@3.12` 并在文档中明确使用方式。
- **Go 下载稳定性**：若 `proxy.golang.org` 不稳定，可记录 `GIT_HTTP_VERSION=HTTP/1.1`/`GOPROXY` 的推荐配置（避免误以为代码问题）。

## 阶段 2（扩展）候选工作项

- **M2.1 多宿主 identity**：identity 的持久化位置、注册流程、最小 UI/无 UI 的配对路径。
- **M2.2 workspaceId 一等公民**：Remote 侧筛选/聚合策略；Runtime/Relay 对缺省 workspace 的行为。
- **M2.3 sync-service 只读联动**：订阅哪些事件、存储/查询接口最小化、权限与审计。
- **import 排序恢复**：选择 `eslint-plugin-import-x` 或 `simple-import-sort` 并落地（可选）。

