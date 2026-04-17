# 🔒 Security

安全策略文档 — 威胁模型、权限控制、数据保护、审计策略。

## 🎯 Role

系统的 **安全基线**，定义威胁边界、权限模型与数据保护策略，确保从架构层面防御已知风险。

```
┌────────────────────────────────────────────┐
│              安全策略覆盖范围                │
│                                            │
│  apps ──► bridge ──► runtime ──► platform  │
│    │                    │                  │
│    └── sandbox ─────────┘                  │
│                                            │
│         docs/security/ (策略定义)           │
└────────────────────────────────────────────┘
```

## ✅ Responsibility

- 威胁模型与攻击面分析
- 权限控制策略（Skill 权限、用户权限、系统权限）
- 数据保护与隐私规范（存储加密、传输加密）
- Sandbox 安全约束
- 依赖安全与供应链审计
- 安全事件响应流程

## 🚧 Boundaries

- 不包含安全机制的实现代码（实现在各模块内）
- 不包含具体密钥或凭证（使用环境变量 / Secret Manager）
- 不替代第三方安全审计报告

## 📁 建议结构

```
security/
├── threat-model.md      # 威胁模型
├── permissions.md       # 权限控制策略
├── data-protection.md   # 数据保护规范
├── sandbox.md           # Sandbox 安全约束
├── supply-chain.md      # 依赖与供应链安全
└── incident-response.md # 安全事件响应
```
