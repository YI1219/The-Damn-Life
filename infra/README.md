# 🛠️ Infra

基础设施 — 部署、容器、CI/CD、打包配置。

## 🎯 Role

系统的**部署与运维层**，管理所有构建、打包、容器化、持续集成相关配置。

## ✅ Responsibility

- Dockerfile / docker-compose（`docker/`）
- 中继服务部署配置（`relay/`）
- CI/CD 流水线配置（`ci/`）
- 安装器打包脚本（`deploy/`）
- 环境配置模板（`packaging/`）

## 🚧 Boundaries

- 不包含运行时代码
- 不包含业务逻辑
