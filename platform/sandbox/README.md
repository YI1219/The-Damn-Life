# 🔒 Sandbox

安全隔离 / 权限控制 / 链接空间。

## 🎯 Role

实现 Skill 和 Runtime 的**安全隔离**，确保强隔离原则落地。

## ✅ Responsibility

- Skill 执行沙箱
- 文件系统访问隔离
- 网络访问控制
- 链接空间底层实现
- 权限策略引擎

## 🚧 Boundaries

- 不做权限审批 UI（由 app-shell 提供）
- 不做业务判断（仅执行策略）
