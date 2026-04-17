# 🔁 Relay

中继服务部署配置 — relay-go 的部署清单、环境变量、运行策略。

## 🎯 Role

定义 `services/relay-go` 在各环境（开发 / 测试 / 生产）的**部署与运行配置**。

```
┌──────────────┐     部署配置     ┌──────────────┐
│ relay-go     │ ◄────────────── │ infra/relay/  │
│ (服务代码)    │                 │ (部署清单)     │
└──────────────┘                 └──────────────┘
```

## ✅ Responsibility

- 各环境的部署参数配置
- 环境变量模板（`.env.example`）
- 健康检查与就绪探针定义
- 资源限制与扩缩策略

## 🚧 Boundaries

- 不包含 relay-go 的业务代码（见 `services/relay-go`）
- 不包含容器镜像构建（见 `infra/docker/`）
- 不包含 CI 触发逻辑（见 `infra/ci/`）
