# 📦 Builtin Skills

产品内置的核心技能 — 默认可用，开箱即得。

## 🎯 Role

系统的**核心能力层**，提供产品默认搭载的技能实现。用户无需额外安装即可使用。

```
Runtime ──load──► builtin/
                    │
                    ├── example/     # 示例技能（开发参考）
                    └── <skill>/     # 实际内置技能
```

## ✅ Responsibility

- 提供经过验证的、稳定的核心技能
- 作为第三方 Skill 开发的参考实现
- 遵循 `docs/skill-spec/` 定义的 Manifest 规范

## 🚧 Boundaries

- 不包含实验性或不稳定的技能（见 `skills/experimental/`）
- 不包含模板骨架（见 `skills/templates/`）
- 不直接访问宿主 OS，通过 Skill Runtime SDK 调用

## 📁 目录结构

```
builtin/
├── README.md
└── example/             # 最小可运行示例
    ├── manifest.json
    ├── main.py
    └── README.md
```
