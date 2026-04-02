# 🌉 Bridges

应用层 ↔ 系统层桥接。

## 🎯 Role

连接上层应用与底层系统能力的**受控桥梁**，实现显式权限原则。

## ✅ Responsibility

- 定义 host bridge 接口
- 系统能力的权限守卫
- 调用审计与日志
- 能力协商协议

## 🚧 Boundaries

- 不实现具体系统能力（由 os / hardware 提供）
- 不包含业务逻辑
