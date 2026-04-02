# 🌐 Web Platform（基座层）

App Shell 的平台基座 — 所有端共享的纯 Web 能力层。

## 🎯 Role

`web/` 是整个 `platform/` 体系的**基座**。App Shell 本质是一个 Web 应用（Tauri = webview + 原生壳），所以所有平台共享的 UI 逻辑、交互能力、通信抽象都定义在 web/ 中，其他端在此基础上做增量覆盖。

```
┌─────────────────────────────────────┐
│           App Shell UI              │
├─────────────────────────────────────┤
│  platform/web/   ← 基座            │
│  ├── PlatformAdapter 抽象接口       │
│  ├── Web 默认实现                   │
│  │   (HTTP/WS, Web APIs, DOM)      │
│  └── 能力检测 & fallback 机制       │
├─────────────────────────────────────┤
│  platform/macos/ ← extends web/    │
│  platform/windows/                  │
│  platform/linux/                    │
│  platform/android/                  │
│  platform/ios/                      │
└─────────────────────────────────────┘
```

## ✅ Responsibility

### 抽象接口定义

- `PlatformAdapter` — 统一平台能力抽象接口
- 通知、文件系统、剪贴板、窗口管理等能力的接口契约
- 平台检测与适配器自动选择机制

### Web 默认实现（基础能力）

- 通知 → Web Notification API
- 文件访问 → File System Access API / 文件上传
- 剪贴板 → Clipboard API
- 窗口管理 → DOM 窗口 / 标签页管理
- 通信 → HTTP / WebSocket
- 持久化 → IndexedDB / localStorage
- 后台 → Service Worker（有限）

### 作为独立 Web 部署

- 无 Tauri 宿主时，直接以纯 Web 模式运行（类似 VS Code → vscode.dev）
- 所有能力走 Web 默认实现，零原生依赖

## 🧩 架构模式

```ts
// web/ 定义抽象接口
interface PlatformAdapter {
  notify(msg: string): Promise<void>
  readFile(path: string): Promise<Uint8Array>
  writeClipboard(text: string): Promise<void>
  // ...
}

// web/ 提供基础实现
class WebAdapter implements PlatformAdapter {
  async notify(msg) {
    new Notification(msg)
  }
  async readFile() {
    /* File System Access API */
  }
  async writeClipboard(text) {
    navigator.clipboard.writeText(text)
  }
}

// macos/ 在 web 基础上覆盖原生能力
class MacOSAdapter extends WebAdapter {
  async notify(msg) {
    await invoke('native_notify', { msg })
  }
  async readFile(p) {
    return await invoke('read_file', { path: p })
  }
  // writeClipboard 不覆盖 → 复用 Web 实现
}
```

## 🚧 Boundaries

- **不做** 原生系统调用 → 各端 adapter 负责
- **不做** 平台特定 UI 差异 → 各端目录负责
- **定义** 统一接口契约 → 各端必须实现
- **不是** `apps/web-console/` → web-console 是远程控制台，本层是主应用基座

## 🔗 与 `apps/web-console/` 的区别

| 入口                      | 定位                  | 用途                     |
| ------------------------- | --------------------- | ------------------------ |
| `app-shell/platform/web/` | 主应用基座 + Web 部署 | 完整体验，各端继承此基座 |
| `apps/web-console/`       | 远程控制台            | 仅远程操控，非主体验     |
