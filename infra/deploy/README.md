# 🚀 Deploy

部署配置 — 安装器打包脚本、发布流程、环境部署清单。

## 🎯 Role

系统的**交付出口**，管理从构建产物到可分发制品的打包与部署流程。

```
build 产物 ──► infra/deploy/ ──► 分发渠道
                    │
                    ├── 桌面安装器 (DMG / MSI / AppImage)
                    ├── 服务部署清单
                    └── CLI 发布配置
```

## ✅ Responsibility

- 桌面应用安装器打包脚本（Tauri bundler 配置）
- 服务部署清单与策略
- CLI 工具发布配置（npm publish）
- 发布前检查清单
- 多平台分发配置

## 🚧 Boundaries

- 不包含 CI 流水线定义（见 `infra/ci/`）
- 不包含容器镜像构建（见 `infra/docker/`）
- 不包含应用业务代码
