# 📦 Installers

系统级安装、注册与服务部署。

## 🎯 Role

负责将系统组件安装到目标 OS 并注册为系统服务。

## ✅ Responsibility

- 安装器脚本（macOS .dmg / Windows .msi / Linux .deb）
- 系统服务注册
- 环境依赖检查
- 升级与卸载逻辑

## 🚧 Boundaries

- 不包含运行时逻辑
- 不做版本管理策略（由 CI/CD 决定）
