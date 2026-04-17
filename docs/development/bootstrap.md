# 🚀 Bootstrap 指南

从零开始搭建本地开发环境。

## 📋 前置要求

| 工具         | 最低版本 | 用途           |
| ------------ | -------- | -------------- |
| Node.js      | `≥ 22`   | JS/TS 运行时   |
| pnpm         | `≥ 10`   | 包管理器       |
| Python       | `≥ 3.11` | Runtime 服务   |
| Go           | `≥ 1.22` | Relay 服务     |
| Rust + Cargo | latest   | Tauri 桌面构建 |
| cargo-tauri  | latest   | Tauri CLI      |

## ⚡ 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/YI1219/The-Damn-Life.git
cd The-Damn-Life
```

### 2. 一键初始化

```bash
pnpm bootstrap
```

此命令会执行 `scripts/bootstrap.ts`，自动完成：

1. **环境检测** — 逐项检查 Node / pnpm / Python / Go / Rust / Cargo Tauri
2. **依赖安装** — 执行 `pnpm install`，链接所有 workspace 包

```
🔍 Checking environment...

  ✅ Node: v24.x.x
  ✅ pnpm: 10.x.x
  ✅ Python: Python 3.x.x
  ✅ Go: go version go1.22.x
  ✅ Rust: rustc 1.x.x
  ✅ Cargo Tauri: tauri-cli 2.x.x

📦 Installing dependencies...

✅ Bootstrap complete.
```

### 3. 启动开发

```bash
# 启动单个项目
pnpm dev app-shell

# 启动所有项目
pnpm dev:all
```

## 🔧 手动设置（可选）

如果 `bootstrap` 提示某项工具缺失：

### Node.js

```bash
# 推荐使用 fnm
brew install fnm
fnm install 22
fnm use 22
```

### pnpm

```bash
corepack enable
corepack prepare pnpm@10.28.2 --activate
```

### Python

```bash
brew install python@3.11
# 或使用 pyenv
pyenv install 3.11
pyenv local 3.11
```

### Go

```bash
brew install go
```

### Rust & Tauri

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
cargo install tauri-cli
```

## 🧹 清理

```bash
# 清理所有构建产物、node_modules、缓存
pnpm clean
```

## ❓ 常见问题

### `@the-damn-life/config` 找不到？

确保 workspace 文件名为 `pnpm-workspace.yaml`（不是 `pnpm.workspace.yaml`），然后重新 `pnpm install`。

### Tauri 构建失败？

确认已安装 Rust 工具链和 `cargo-tauri`。macOS 还需要 Xcode Command Line Tools：

```bash
xcode-select --install
```
