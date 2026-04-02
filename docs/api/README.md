# 🔌 API

API 规范文档 — 接口定义、请求/响应格式、版本策略。

## 🎯 Role

系统的 **接口契约中心**，定义所有对外与模块间的 API 规范，确保前后端、服务间通信一致。

```
┌──────────────┐      API 规范      ┌──────────────┐
│  apps / cli  │ ◄────────────────► │   services   │
└──────────────┘                    └──────────────┘
                    docs/api/
                  (契约定义层)
```

## ✅ Responsibility

- RESTful / RPC 接口定义
- 请求与响应数据结构（Schema）
- 错误码与异常规范
- 版本管理与兼容策略
- 认证 & 鉴权接口说明

## 🚧 Boundaries

- 不包含接口实现代码（实现在对应 service 内）
- 不包含事件/消息协议（见 `docs/protocols/`）
- 不包含 SDK 或客户端封装

## 📁 建议结构

```
api/
├── overview.md          # API 总览与约定
├── auth.md              # 认证鉴权接口
├── runtime.md           # Runtime 服务 API
├── relay.md             # Relay 服务 API
├── schemas/             # JSON Schema / 类型定义
└── errors.md            # 统一错误码表
```
