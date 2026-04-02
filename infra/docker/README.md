# 🐳 Docker

容器化配置 — Dockerfile、docker-compose、镜像构建。

## 🎯 Role

为系统中需要容器化部署的服务提供**镜像构建与编排定义**。

```
docker/
  │
  ├── runtime-py  → services/runtime-py 的容器化
  ├── relay-go    → services/relay-go 的容器化
  └── compose     → 多服务本地编排
```

## ✅ Responsibility

- 各服务的 Dockerfile（多阶段构建）
- `docker-compose.yml` 本地多服务编排
- 镜像构建参数与环境变量约定
- `.dockerignore` 配置

## 🚧 Boundaries

- 不包含服务的业务代码（见 `services/`）
- 不包含 K8s / 云平台编排（如需要放在 `infra/deploy/`）
- 不包含 CI 流水线定义（见 `infra/ci/`）
