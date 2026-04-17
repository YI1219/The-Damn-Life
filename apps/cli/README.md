# ⌨️ CLI

命令行客户端 — 脚本化控制端。

## 🎯 Role

CLI 是系统的**脚本化入口**，供开发者和自动化场景通过命令行发送任务、查看状态、管理 Skill。

```
$ damn send "整理下载目录"
$ damn task list
$ damn skill install builtin:file-organizer
```

## ✅ Responsibility

- 命令行发任务
- 查看任务/设备状态
- Skill 安装 / 管理
- Runtime 控制（启动 / 重启）
- 批量自动化调用

## 🚧 Boundaries

- **不做** GUI 交互 → 交给 `app-shell` 或 `web-console`
- **不做** AI 编排 → 通过 SDK 调用 Runtime
- **不做** 远程穿透 → 通过 relay API

## ⚙️ Tech Stack

| Layer   | Tech                     |
| ------- | ------------------------ |
| Runtime | Node.js + tsx            |
| Lang    | TypeScript               |
| Binary  | `damn` (via `bin` field) |
