# 👻 Daemon

系统守护进程 / 后台代理。

## 🎯 Role

管理系统级后台进程，确保 Runtime 和关键服务在用户不交互时也能持续运行。

## ✅ Responsibility

- Runtime 生命周期管理
- 开机自启配置
- 后台进程健康检查
- 系统服务注册（systemd / launchd / Windows Service）

## 🚧 Boundaries

- 不包含 AI 编排逻辑
- 不进行任务调度（由 Runtime 负责）
