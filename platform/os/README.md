# 💻 OS

操作系统桥接与适配。

## 🎯 Role

封装 Windows / macOS / Linux 差异，提供统一的系统调用接口。

## ✅ Responsibility

- 文件系统差异适配
- 进程管理差异封装
- 系统通知 / 热键 / 托盘等 OS 原生能力
- 环境变量与路径规范化

## 🚧 Boundaries

- 不包含业务逻辑
- 不直接暴露给 Skill（通过 bridge 受控访问）
