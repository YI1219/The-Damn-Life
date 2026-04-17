# 📦 Packaging

环境配置模板 — 各环境变量模板、运行时配置、打包参数。

## 🎯 Role

为各模块提供**环境配置基线**，统一管理不同部署环境的参数模板。

```
packaging/
  │
  ├── .env.development    # 开发环境模板
  ├── .env.staging        # 预发布环境模板
  └── .env.production     # 生产环境模板
```

## ✅ Responsibility

- 各环境的变量模板（`.env.example` / `.env.*`）
- 运行时配置参数基线
- 构建时参数（feature flags、公钥等）
- 配置校验规则

## 🚧 Boundaries

- 不包含实际密钥或凭证（使用 Secret Manager / CI secrets）
- 不包含应用级业务配置（业务配置在各模块内部）
- 不替代 `packages/config` 的 TS/构建配置
