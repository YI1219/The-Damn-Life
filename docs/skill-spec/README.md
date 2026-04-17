# 🧩 Skill Spec

Skill 开发规范 — Skill 结构定义、生命周期、权限模型、发布流程。

## 🎯 Role

系统的 **Skill 扩展契约**，为第一方与第三方 Skill 开发者提供统一的开发标准与约束。

```
┌─────────────────┐
│   Skill 开发者   │
└────────┬────────┘
         │ 遵循
         ▼
┌─────────────────┐      load      ┌──────────┐
│  skill-spec/    │ ◄──────────── │  runtime  │
│  (规范定义)      │               │  (执行层)  │
└─────────────────┘               └──────────┘
```

## ✅ Responsibility

- Skill Manifest 结构定义（`manifest.json` / `manifest.yaml`）
- Skill 生命周期（注册 → 加载 → 执行 → 卸载）
- 权限模型与 Sandbox 约束
- 输入/输出接口规范
- Skill 模板与示例规范
- 版本兼容与发布流程

## 🚧 Boundaries

- 不包含 Skill 的业务实现代码（见 `skills/`）
- 不包含 Runtime 的加载机制实现（见 `services/runtime-py`）
- 不替代 API 文档（Skill 调用的 API 见 `docs/api/`）

## 📁 建议结构

```
skill-spec/
├── overview.md          # Skill 系统总览
├── manifest.md          # Manifest 规范
├── lifecycle.md         # 生命周期定义
├── permissions.md       # 权限与沙箱模型
├── io-contract.md       # 输入/输出接口
└── publishing.md        # 发布与版本管理
```
