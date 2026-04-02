# ⚙️ CI

持续集成配置 — 流水线定义、自动化检查、构建与发布触发。

## 🎯 Role

系统的**自动化质量关卡**，定义代码提交后的检查、构建、测试、发布流水线。

```
Push / PR ──► CI Pipeline
                │
                ├── lint & typecheck
                ├── test
                ├── build
                └── deploy (on tag/release)
```

## ✅ Responsibility

- GitHub Actions workflow 定义
- PR 检查流水线（lint / typecheck / test）
- 构建产物生成与缓存策略
- 发布触发条件与流程
- 矩阵构建配置（多平台 / 多版本）

## 🚧 Boundaries

- 不包含本地脚本（见 `scripts/`）
- 不包含部署目标配置（见 `infra/deploy/`）
- 不包含镜像构建定义（见 `infra/docker/`）
