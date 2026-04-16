# 阶段 3（稳定 / GA）里程碑（占位）

> 将 [`overview.md`](../overview.md) 中「稳定 / GA」一行展开为可验收块；**尚未开工**，条目随讨论调整。  
> 约束与阶段 2 相同：契约变更走 `event-contracts`；Relay 载荷透明；编排归 Runtime。

## 目标（方向性）

- **协作状态**：多写入、离线、重连下的可预期行为（含同步与 UI 反馈）
- **生产化**：可观测性、备份/恢复路径、配置与密钥处理的最低标准
- **可选运维面**：设备级视图仅作次级入口，不颠覆工作区/任务主叙事

## 建议里程碑（草案）

> 进度：`Done` / `In progress` / `Todo`。每项尽量有 **脚本或 CI** 验收，其次手工。

### M3.1 `sync-service` 冲突与一致性（最小）

- **交付**：在明确策略下处理并发写入或版本分叉（可先 **last-write** + 审计，再演进）
- **验证**：双客户端交错写入后，读模型与审计可追溯

- **Checklist**
  - [ ] **Todo**：冲突策略文档 + 与 `event-contracts` 对齐的字段/版本号（若需要）
  - [ ] **Todo**：存储层从纯内存 MVP 迁出时的迁移与单测
  - [ ] **Todo**：脚本或集成测试覆盖「冲突/交错写入」最小场景

### M3.2 离线、重连与镜像补偿

- **交付**：客户端与服务在短暂断链后能恢复；mirror 失败可补偿或显式提示缺口
- **验证**：与 `pnpm sync:smoke` 同类脚本扩展（断链时长、重试、幂等）
- **Checklist**
  - [x] **Done**（web-console）：mirror `POST` **有限重试** + Session「Sync mirror」区 **Mirror gap / last ok** 提示（仍 best-effort，非持久队列）
  - [ ] **Todo**：Host 侧 mirror 与/或客户端 **持久队列**、可配置重试（与 Remote 对齐策略）
  - [ ] **Todo**：CI 或脚本扩展验收断链→恢复（在 `sync:smoke` 一类上加长场景）

### M3.3 可观测性与故障手册

- **交付**：关键路径日志/指标约定；开发者能按文档定位 Relay / Runtime / sync 问题
- **验证**：`docs/` 中一页「常见故障」+ 示例查询或日志字段
- **Checklist**
  - [ ] **Todo**：`relay-go` / `runtime-py` / `sync-service` 结构化日志字段约定
  - [ ] **Todo**：`docs/runbooks/` 或 `docs/troubleshooting.md` 最小篇
  - [ ] **Todo**：可选：本地 compose 或脚本一键拉齐依赖用于复现

### M3.4 运维设备视图（可选）

- **交付**：只读或受限写；默认仍从工作区进入
- **验证**：与主控制台信息架构不冲突（IA 评审 checklist）

- **Checklist**
  - [ ] **Todo**：是否做、放在 `admin-console` 还是独立路由
  - [ ] **Todo**：权限模型（至少与现有「显式授权」原则一致）

## 风险与门控

- **范围**：阶段 3 易膨胀；优先 **M3.1–M3.2** 与现有 sync / relay 路径，避免并行大改
- **安全**：任何跨设备持久化与运维能力需对照 [`docs/security/`](../../security/)

## 上一步

- 阶段 2 完成情况见 [`phase2-planning.md`](phase2-planning.md)。
