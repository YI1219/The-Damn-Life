# Skills

Skill 扩展生态 — 系统能力的业务扩展点。

## 🎯 Role

Skills 是 The Damn Life 系统的扩展层，让 Runtime 具备具体的业务能力（文件整理、提醒、摘要等）。所有 Skill 通过统一的 manifest 规范注册，由 Runtime 调度执行。

## ✅ Responsibility

- 提供内置技能（`builtin/`）
- 提供实验性技能（`experimental/`）
- 提供技能开发模板（`templates/`）

## 🚧 Boundaries

- 不直接访问宿主系统能力，通过 Skill Runtime SDK 受控调用
- 不侵入系统内核或修改 Runtime 内部实现
- 不依赖 `apps/*` 或 `services/*` 的具体代码

## 📁 Directory

| Directory       | Description                        |
| --------------- | ---------------------------------- |
| `builtin/`      | 产品内置的核心技能，默认可用       |
| `experimental/` | 实验中的技能，不承诺稳定           |
| `templates/`    | 技能开发模板骨架，不是实际业务技能 |
